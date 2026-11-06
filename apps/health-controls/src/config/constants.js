// AutoPack brand colour palette
export const BRAND_COLORS = {
  orange: '#FF7900',
  green: '#16A34A',
  blue: '#1677FF',
  pink: '#FF4F9A',
  yellow: '#FFD400',
};

// Health parameter configuration
//
// IMPORTANT: Exact validation ranges and units for Temperature, Vibration,
// and Operating Duration must be coordinated with Teammate 5.
// Machine Wear (0–100%) is confirmed.
//
// Replace null placeholders once ranges are agreed.

export const PARAMETER_CONFIG = {
  temperature: {
    unit: '°C',
    min: null,
    max: null,
    step: 0.1,
  },
  vibration: {
    unit: null,
    min: null,
    max: null,
    step: 0.01,
  },
  operatingDuration: {
    unit: null,
    min: null,
    max: null,
    step: 1,
  },
  machineWear: {
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
  },
};

// Health classification labels
// Exact score thresholds will come from Teammate 5's health logic.

export const HEALTH_CLASSIFICATIONS = {
  NORMAL: 'Normal',
  WARNING: 'Warning',
  ABNORMAL: 'Abnormal',
  CRITICAL: 'Critical',
};

// Initial normal operating values.
// These are displayed but NOT automatically submitted.

export const NORMAL_VALUES = {
  temperature: null,
  vibration: null,
  operatingDuration: null,
  machineWear: 0,
};