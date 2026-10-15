import crypto from 'crypto';
import { AppError } from '../utils/AppError.js';

export function createWooCommerceClient({
  storeUrl,
  consumerKey,
  consumerSecret,
  timeoutMs = 10000,
  fetchFn = globalThis.fetch,
} = {}) {
  // Normalize store URL (strip trailing slash)
  const normalizedUrl = storeUrl ? storeUrl.replace(/\/+$/, '') : '';

  /**
   * Detect if the store is HTTP-only (not HTTPS).
   * WooCommerce REST API over HTTP requires OAuth 1.0a HMAC-SHA1 authentication.
   * Basic Auth and raw query parameters are rejected by WooCommerce core over insecure HTTP.
   */
  function isHttpOnly() {
    return normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://');
  }

  /**
   * Build Basic Auth headers for HTTPS stores.
   */
  function buildBasicAuthHeaders() {
    if (!consumerKey || !consumerSecret) {
      return { 'Content-Type': 'application/json', Accept: 'application/json' };
    }
    const token = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    return {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Generates OAuth 1.0a one-legged HMAC-SHA1 signed URL for HTTP WooCommerce stores.
   * Required by WooCommerce when communicating over plain HTTP without TLS/SSL.
   * Parameters are percent-encoded and signed following RFC 5849.
   * IMPORTANT: Never log the signed URL or any credential parameter.
   */
  function buildOAuth1Url(fullUrl, method = 'GET') {
    if (!consumerKey || !consumerSecret) {
      return fullUrl;
    }

    const [baseUrl, existingQuery] = fullUrl.split('?');
    const params = {};

    // Include existing query parameters
    if (existingQuery) {
      const searchParams = new URLSearchParams(existingQuery);
      for (const [k, v] of searchParams.entries()) {
        params[k] = v;
      }
    }

    // Add OAuth 1.0a parameters
    params.oauth_consumer_key = consumerKey;
    params.oauth_nonce = crypto.randomBytes(16).toString('hex');
    params.oauth_signature_method = 'HMAC-SHA1';
    params.oauth_timestamp = Math.floor(Date.now() / 1000).toString();
    params.oauth_version = '1.0';

    // RFC 5849 parameter normalization: sort alphabetically by encoded key
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');

    // Base string: METHOD & encode(baseUrl) & encode(paramString)
    const baseString = `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(consumerSecret)}&`;
    const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

    params.oauth_signature = signature;

    const queryString = Object.keys(params)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');

    return `${baseUrl}?${queryString}`;
  }

  async function request(endpoint, options = {}) {
    if (!normalizedUrl) {
      throw new Error('WooCommerce store URL is not configured');
    }

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const baseUrl = `${normalizedUrl}/wp-json/wc/v3${path}`;
    const method = options.method || 'GET';

    let fetchUrl;
    let fetchHeaders;

    if (isHttpOnly()) {
      // WooCommerce strictly requires OAuth 1.0a one-legged HMAC-SHA1 for non-HTTPS stores.
      fetchUrl = buildOAuth1Url(baseUrl, method);
      fetchHeaders = { 'Content-Type': 'application/json', Accept: 'application/json' };
    } else {
      // Standard Basic Auth for HTTPS stores.
      fetchUrl = baseUrl;
      fetchHeaders = buildBasicAuthHeaders();
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || timeoutMs);

    try {
      const res = await fetchFn(fetchUrl, {
        method: options.method || 'GET',
        headers: {
          ...fetchHeaders,
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      const contentType = res.headers.get('content-type') || '';
      let body;
      if (contentType.includes('application/json')) {
        body = await res.json();
      } else {
        const text = await res.text();
        body = { raw: text };
      }

      if (!res.ok) {
        const message = body?.message || `WooCommerce API returned HTTP ${res.status}`;
        throw new AppError(message, res.status, body?.code || 'WOOCOMMERCE_API_ERROR');
      }

      return {
        data: body,
        status: res.status,
        headers: {
          total: res.headers.get('x-wp-total'),
          totalPages: res.headers.get('x-wp-totalpages'),
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    isConfigured() {
      return Boolean(normalizedUrl && consumerKey && consumerSecret);
    },

    getStoreUrl() {
      return normalizedUrl;
    },

    /**
     * Checks connection health to WooCommerce REST API.
     * Hits /system_status or falls back to /products?per_page=1.
     */
    async checkConnection() {
      if (!normalizedUrl) {
        return {
          connected: false,
          configured: false,
          storeUrl: null,
          reason: 'WOOCOMMERCE_STORE_URL is not configured',
        };
      }

      if (!consumerKey || !consumerSecret) {
        return {
          connected: false,
          configured: false,
          storeUrl: normalizedUrl,
          reason: 'WooCommerce API credentials (consumer key/secret) are not configured',
        };
      }

      try {
        const res = await request('/products?per_page=1');
        return {
          connected: true,
          configured: true,
          storeUrl: normalizedUrl,
          status: res.status,
        };
      } catch (err) {
        return {
          connected: false,
          configured: true,
          storeUrl: normalizedUrl,
          statusCode: err.statusCode || err.status || 500,
          errorCode: err.code || 'CONNECTION_FAILED',
          reason: err.message,
        };
      }
    },

    /**
     * Fetch products from WooCommerce
     */
    async getProducts(params = {}) {
      const q = new URLSearchParams();
      if (params.page) q.set('page', String(params.page));
      if (params.perPage || params.pageSize) q.set('per_page', String(params.perPage || params.pageSize || 20));
      if (params.status) q.set('status', params.status);
      const queryStr = q.toString();
      return request(`/products${queryStr ? `?${queryStr}` : ''}`);
    },

    /**
     * Fetch orders from WooCommerce
     */
    async getOrders(params = {}) {
      const q = new URLSearchParams();
      if (params.page) q.set('page', String(params.page));
      if (params.perPage || params.pageSize) q.set('per_page', String(params.perPage || params.pageSize || 20));
      if (params.status) q.set('status', params.status);
      if (params.customer) q.set('customer', String(params.customer));
      if (params.after) q.set('after', params.after);
      if (params.before) q.set('before', params.before);
      const queryStr = q.toString();
      return request(`/orders${queryStr ? `?${queryStr}` : ''}`);
    },

    /**
     * Fetch customers from WooCommerce (where supported/authorized)
     */
    async getCustomers(params = {}) {
      const q = new URLSearchParams();
      if (params.page) q.set('page', String(params.page));
      if (params.perPage || params.pageSize) q.set('per_page', String(params.perPage || params.pageSize || 20));
      if (params.search) q.set('search', params.search);
      const queryStr = q.toString();
      return request(`/customers${queryStr ? `?${queryStr}` : ''}`);
    },
  };
}
