// Fictional catalog data for realistic eCommerce CRM simulation

export const CATEGORIES = [
  'Apparel',
  'Footwear',
  'Accessories',
  'Home & Living',
  'Equipment',
];

export const PRODUCTS = [
  // Apparel
  { id: 'prod_app_01', name: 'Merino Wool Trail Hoodie', sku: 'APP-MTH-01', category: 'Apparel', unitPrice: 88.0 },
  { id: 'prod_app_02', name: 'Classic Organic Cotton Tee', sku: 'APP-COT-02', category: 'Apparel', unitPrice: 28.0 },
  { id: 'prod_app_03', name: 'WeatherShield Windbreaker', sku: 'APP-WB-03', category: 'Apparel', unitPrice: 124.0 },
  { id: 'prod_app_04', name: 'Everyday Chino Trousers', sku: 'APP-CHN-04', category: 'Apparel', unitPrice: 65.0 },
  { id: 'prod_app_05', name: 'Thermal Base Layer Crew', sku: 'APP-TBL-05', category: 'Apparel', unitPrice: 42.0 },

  // Footwear
  { id: 'prod_ftw_01', name: 'All-Terrain Trekking Boots', sku: 'FTW-ATB-01', category: 'Footwear', unitPrice: 165.0 },
  { id: 'prod_ftw_02', name: 'Urban Minimalist Sneakers', sku: 'FTW-UMS-02', category: 'Footwear', unitPrice: 110.0 },
  { id: 'prod_ftw_03', name: 'Slip-On Canvas Deck Shoes', sku: 'FTW-CDS-03', category: 'Footwear', unitPrice: 54.0 },
  { id: 'prod_ftw_04', name: 'Cushioned Trail Running Shoes', sku: 'FTW-TRS-04', category: 'Footwear', unitPrice: 135.0 },
  { id: 'prod_ftw_05', name: 'Waterproof Recovery Slides', sku: 'FTW-WRS-05', category: 'Footwear', unitPrice: 38.0 },

  // Accessories
  { id: 'prod_acc_01', name: 'Waxed Canvas Daypack 22L', sku: 'ACC-WCD-01', category: 'Accessories', unitPrice: 94.0 },
  { id: 'prod_acc_02', name: 'Polarized Aviator Sunglasses', sku: 'ACC-PAS-02', category: 'Accessories', unitPrice: 72.0 },
  { id: 'prod_acc_03', name: 'Full-Grain Leather Wallet', sku: 'ACC-FGL-03', category: 'Accessories', unitPrice: 45.0 },
  { id: 'prod_acc_04', name: 'Insulated Thermal Bottle 32oz', sku: 'ACC-ITB-04', category: 'Accessories', unitPrice: 32.0 },
  { id: 'prod_acc_05', name: 'Merino Wool Beanie', sku: 'ACC-MWB-05', category: 'Accessories', unitPrice: 26.0 },

  // Home & Living
  { id: 'prod_hom_01', name: 'Handcrafted Ceramic Mug Set', sku: 'HOM-CMS-01', category: 'Home & Living', unitPrice: 48.0 },
  { id: 'prod_hom_02', name: 'French Linen Throw Blanket', sku: 'HOM-LTB-02', category: 'Home & Living', unitPrice: 115.0 },
  { id: 'prod_hom_03', name: 'Aromatherapy Soy Candle (Pine & Amber)', sku: 'HOM-ASC-03', category: 'Home & Living', unitPrice: 24.0 },
  { id: 'prod_hom_04', name: 'Walnut Wood Pour-Over Coffee Stand', sku: 'HOM-WCS-04', category: 'Home & Living', unitPrice: 78.0 },
  { id: 'prod_hom_05', name: 'Cast Iron Dutch Oven 5.5Qt', sku: 'HOM-CDO-05', category: 'Home & Living', unitPrice: 145.0 },

  // Equipment
  { id: 'prod_eqp_01', name: 'Ultralight Carbon Trekking Poles', sku: 'EQP-UTP-01', category: 'Equipment', unitPrice: 85.0 },
  { id: 'prod_eqp_02', name: 'Compact 2-Person Backpacking Tent', sku: 'EQP-CBT-02', category: 'Equipment', unitPrice: 189.0 },
  { id: 'prod_eqp_03', name: 'High-Lumen Rechargeable Headlamp', sku: 'EQP-HRH-03', category: 'Equipment', unitPrice: 44.0 },
  { id: 'prod_eqp_04', name: 'Packable Inflatable Sleeping Pad', sku: 'EQP-PIS-04', category: 'Equipment', unitPrice: 68.0 },
  { id: 'prod_eqp_05', name: 'Titanium Camping Cookset', sku: 'EQP-TCC-05', category: 'Equipment', unitPrice: 52.0 },
];

export const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Jackson', 'Avery',
  'David', 'Ella', 'Joseph', 'Scarlett', 'Samuel', 'Grace', 'Sebastian',
  'Chloe', 'Gabriel', 'Victoria', 'Carter', 'Riley', 'Jayden', 'Aria',
  'John', 'Lily', 'Luke', 'Aubrey', 'Anthony', 'Zoey', 'Isaac',
];

export const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts',
];

export const CITIES_AND_STATES = [
  { city: 'Austin', state: 'TX' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Denver', state: 'CO' },
  { city: 'Portland', state: 'OR' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Boston', state: 'MA' },
  { city: 'San Francisco', state: 'CA' },
  { city: 'San Diego', state: 'CA' },
  { city: 'New York', state: 'NY' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Minneapolis', state: 'MN' },
  { city: 'Raleigh', state: 'NC' },
  { city: 'Salt Lake City', state: 'UT' },
  { city: 'Nashville', state: 'TN' },
  { city: 'Phoenix', state: 'AZ' },
];

export const PAYMENT_METHODS = [
  'credit_card',
  'paypal',
  'apple_pay',
  'google_pay',
  'shop_pay',
];

export const COUPONS = [
  { code: 'WELCOME10', discountPercent: 0.10 },
  { code: 'VIP20', discountPercent: 0.20 },
  { code: 'SPRING15', discountPercent: 0.15 },
  { code: 'SUMMERFLASH', discountPercent: 0.10 },
  { code: 'HOLIDAY25', discountPercent: 0.25 },
];
