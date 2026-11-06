
/**
 * Centralised configuration and constants for the AutoPack Customer Website.
 *
 * Strict five-colour palette:
 * - Bright Orange: #FF7900
 * - Bright Green:  #16A34A
 * - Bright Blue:   #1677FF
 * - Bright Pink:   #FF4F9A
 * - Bright Yellow: #FFD400
 */

export const BRAND_COLORS = {
  orange: {
    name: 'orange',
    accent: '#FF7900',
    hover: '#E56D00',
    contrastText: '#FFFFFF',
    border: '#FF7900',
    lightBg: '#FFF7ED',
  },
  green: {
    name: 'green',
    accent: '#16A34A',
    hover: '#15803D',
    contrastText: '#FFFFFF',
    border: '#16A34A',
    lightBg: '#F0FDF4',
  },
  blue: {
    name: 'blue',
    accent: '#1677FF',
    hover: '#0958D9',
    contrastText: '#FFFFFF',
    border: '#1677FF',
    lightBg: '#EFF6FF',
  },
  pink: {
    name: 'pink',
    accent: '#FF4F9A',
    hover: '#E03D84',
    contrastText: '#FFFFFF',
    border: '#FF4F9A',
    lightBg: '#FDF2F8',
  },
  yellow: {
    name: 'yellow',
    accent: '#FFD400',
    hover: '#E6BE00',
    contrastText: '#1F2937',
    border: '#FFD400',
    lightBg: '#FEFCE8',
  },
};

/**
 * Four glass ball products — each with a distinct fictional brand.
 *
 * Brands are for demonstration purposes only and are not associated
 * with real companies.
 */

export const PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Product 1',
    title: 'Red Glass Ball',
    brand: 'CrimsonCraft',
    brandTagline: 'Bold. Brilliant. Red.',
    price: 100,
    color: 'orange',
    colorHex: '#FF7900',
    imageFile: 'red-glass-ball.png',
    shortDescription:
      'Vibrant ruby-red borosilicate glass sphere — precision-formed for flawless optical clarity.',
    longDescription:
      "CrimsonCraft's signature ruby-red borosilicate glass sphere, precision kiln-formed for flawless surface clarity and brilliant light diffusion. Each unit passes robotic computer-vision inspection for dimensional accuracy before packing.",
    specs: {
      diameter: '60 mm',
      material: 'Borosilicate Glass',
      finish: 'Polished Gloss',
      sealType: 'Individual Foam-Cushion Box',
    },
    searchTags: 'red ruby crimson crimsoncraft glass ball sphere',
    referencePrice: 140,
  },
  {
    id: 'prod-2',
    name: 'Product 2',
    title: 'Yellow Glass Ball',
    brand: 'Aurelius Optics',
    brandTagline: 'Luminous by Design.',
    price: 200,
    color: 'yellow',
    colorHex: '#FFD400',
    imageFile: 'yellow-glass-ball.png',
    shortDescription:
      'Luminous amber-gold glass orb with optical-grade smooth surface and consistent spherical tolerance.',
    longDescription:
      "Aurelius Optics' luminous amber-gold borosilicate sphere, cold-worked to optical-grade smoothness. Manufactured under strict dimensional tolerance with every unit tested for weight-class consistency before automated sealing.",
    specs: {
      diameter: '75 mm',
      material: 'Borosilicate Glass',
      finish: 'High-Gloss Optical',
      sealType: 'Double-Wall Cushion Pack',
    },
    searchTags: 'yellow gold amber aurelius optics glass ball sphere',
    referencePrice: 280,
  },
  {
    id: 'prod-3',
    name: 'Product 3',
    title: 'Blue Glass Ball',
    brand: 'Azura Studio',
    brandTagline: 'Depth in Every Sphere.',
    price: 300,
    color: 'blue',
    colorHex: '#1677FF',
    imageFile: 'blue-glass-ball.png',
    shortDescription:
      'Deep sapphire-blue art-glass sphere with bubble-free optical clarity — inspected by robotic vision.',
    longDescription:
      "Azura Studio's deep sapphire borosilicate sphere, kiln-formed and cold-worked to achieve exceptional bubble-free optical clarity. 100% robotic-vision inspected for surface micro-defects before precision sealing.",
    specs: {
      diameter: '90 mm',
      material: 'Art Borosilicate Glass',
      finish: 'Sapphire Gloss',
      sealType: 'Rigid Foam Insert Box',
    },
    searchTags: 'blue sapphire azure azura studio glass ball sphere',
    referencePrice: 420,
  },
  {
    id: 'prod-4',
    name: 'Product 4',
    title: 'Green Glass Ball',
    brand: 'Verdant Luxe',
    brandTagline: 'Nature, Captured in Glass.',
    price: 500,
    color: 'green',
    colorHex: '#16A34A',
    imageFile: 'green-glass-ball.png',
    shortDescription:
      'Flagship emerald-green handcrafted glass orb with premium protective packaging and authenticity certificate.',
    longDescription:
      "Verdant Luxe's flagship emerald-green handcrafted borosilicate orb. Flame-worked by precision robotic torch units, cold-polished to optical grade. Ships in tamper-evident luxury foam with a numbered authenticity certificate.",
    specs: {
      diameter: '110 mm',
      material: 'Premium Handcrafted Borosilicate',
      finish: 'Emerald Optical Gloss',
      sealType: 'Luxury Foam + Tamper Seal',
    },
    searchTags: 'green emerald verdant luxe glass ball sphere',
    referencePrice: 700,
  },
];

export const QUANTITY_LIMITS = {
  min: 0,
  max: 5,
};

export const INITIAL_WALLET_BALANCE = 10000;

export const RECHARGE_AMOUNTS = [1000, 2000, 5000, 10000];

export const ORDER_TYPES = {
  NORMAL: 'Normal',
  RUSH: 'Rush',
};

export const RUSH_SURCHARGE_PERCENT = 0.20;

export const RUSH_DEADLINES = [
  { value: 3, label: '3 mins', seconds: 180 },
  { value: 4, label: '4 mins', seconds: 240 },
  { value: 5, label: '5 mins', seconds: 300 },
  { value: 6, label: '6 mins', seconds: 360 },
  { value: 7, label: '7 mins', seconds: 420 },
];

export const ORDER_STATUSES = {
  RECEIVED: 'Order Received',
  QUEUED: 'Queued',
  PACKING: 'Packing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_STEPS = [
  {
    key: 'RECEIVED',
    label: 'Order Received',
    desc: 'Order received and logged in system',
  },
  {
    key: 'QUEUED',
    label: 'Queued',
    desc: 'Assigned to packaging conveyor queue',
  },
  {
    key: 'PACKING',
    label: 'Packing',
    desc: 'Robotic pick, pack and sealing in progress',
  },
  {
    key: 'COMPLETED',
    label: 'Completed',
    desc: 'Packaged and ready for dispatch',
  },
];

export const GUEST_ID_REGEX = /^Guest_\d+$/;

/**
 * Promotional brand campaigns.
 *
 * Four brand advertisements use interactive animated colour themes.
 *
 * Brand backgrounds:
 * 1. CrimsonCraft — bright orange.
 * 2. Aurelius Optics — bright yellow.
 * 3. Azura Studio — bright blue.
 * 4. Verdant Luxe — bright green.
 *
 * Exactly one product-specific offer:
 * 5. Aurelius Optics — Yellow Glass Ball.
 *
 * Brand slides do not display product photographs.
 * Only the fifth slide retains the actual Yellow Glass Ball photograph.
 *
 * backgroundTheme identifies the animation style used by PromoCarousel.
 * backgroundColors provides the colours for its animated artwork.
 */

export const PROMO_BANNERS = [
  {
    id: 'promo-1',
    type: 'brand',
    brand: 'CrimsonCraft',
    tag: 'BRAND STORY',
    heading: 'Bold in Every Detail.',
    subheading:
      'A distinctive identity built around confidence, individuality and exceptional attention to detail.',
    buttonText: 'Discover CrimsonCraft',
    ctaPage: 'products',
    searchQuery: 'CrimsonCraft',
    accent: '#A84200',
    surface: '#FF7900',
    textColor: '#321500',
    backgroundTheme: 'crimson',
    backgroundColors: {
      base: '#FF7900',
      secondary: '#F06C00',
      glow: '#FFA64D',
      highlight: '#FFD0A6',
    },
  },
  {
    id: 'promo-2',
    type: 'brand',
    brand: 'Aurelius Optics',
    tag: 'BRAND PHILOSOPHY',
    heading: 'Luminous by Design.',
    subheading:
      'A thoughtful expression of precision, refinement and timeless contemporary design.',
    buttonText: 'Discover Aurelius',
    ctaPage: 'products',
    searchQuery: 'Aurelius Optics',
    accent: '#775B00',
    surface: '#FFD400',
    textColor: '#302400',
    backgroundTheme: 'aurelius',
    backgroundColors: {
      base: '#FFD400',
      secondary: '#E6BF00',
      glow: '#FFE566',
      highlight: '#FFF3B0',
    },
  },
  {
    id: 'promo-3',
    type: 'brand',
    brand: 'Azura Studio',
    tag: 'BRAND SPOTLIGHT',
    heading: 'A Different Point of View.',
    subheading:
      'An independent creative identity defined by originality, imagination and modern expression.',
    buttonText: 'Discover Azura Studio',
    ctaPage: 'products',
    searchQuery: 'Azura Studio',
    accent: '#0849A0',
    surface: '#1677FF',
    textColor: '#061A36',
    backgroundTheme: 'azura',
    backgroundColors: {
      base: '#1677FF',
      secondary: '#0C62E8',
      glow: '#5197FF',
      highlight: '#B2D2FF',
    },
  },
  {
    id: 'promo-4',
    type: 'brand',
    brand: 'Verdant Luxe',
    tag: 'OUR PHILOSOPHY',
    heading: 'Refined. Considered. Distinctive.',
    subheading:
      'A premium identity that values thoughtful design, understated elegance and individuality.',
    buttonText: 'Discover Verdant Luxe',
    ctaPage: 'products',
    searchQuery: 'Verdant Luxe',
    accent: '#075C2B',
    surface: '#16A34A',
    textColor: '#062B16',
    backgroundTheme: 'verdant',
    backgroundColors: {
      base: '#16A34A',
      secondary: '#118C40',
      glow: '#55C77B',
      highlight: '#B0E9C0',
    },
  },
  {
    id: 'promo-5',
    type: 'offer',
    brand: 'Aurelius Optics',
    tag: 'FEATURED PRODUCT OFFER',
    heading: 'The Aurelius Trio.',
    subheading:
      'Discover three Yellow Glass Balls for a total of ₹600. Each ball retains its fixed unit price of ₹200.',
    buttonText: 'Explore the Featured Offer',
    ctaPage: 'products',
    searchQuery: 'Yellow Glass Ball',
    accent: '#FF7900',
    surface: '#FFF4E8',
    productImage: 'yellow-glass-ball.png',
  },
];
