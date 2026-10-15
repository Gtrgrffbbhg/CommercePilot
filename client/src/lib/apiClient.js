// Normalized API client with fetch wrapper and unified error mapping

export class ApiError extends Error {
  constructor(message, status = 500, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiClient(endpoint, options = {}) {
  const { signal, headers = {}, ...customConfig } = options;

  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal,
    ...customConfig,
  };

  try {
    const response = await fetch(endpoint, config);

    // Attempt to parse JSON response
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === 'object' && data.error && data.error.message) ||
        `Request failed with status ${response.status} (${response.statusText})`;

      const errorCode =
        (data && typeof data === 'object' && data.error && data.error.code) ||
        `HTTP_${response.status}`;

      const errorDetails = data && typeof data === 'object' && data.error && data.error.details;

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    return data;
  } catch (err) {
    // If request was aborted by component unmount, bubble up without altering message
    if (err.name === 'AbortError') {
      throw err;
    }

    // Re-throw if already an ApiError
    if (err instanceof ApiError) {
      throw err;
    }

    // Network / connection refused error
    throw new ApiError(
      'API server is unreachable. Please verify that the backend is running on http://localhost:4000.',
      0,
      'NETWORK_ERROR'
    );
  }
}
