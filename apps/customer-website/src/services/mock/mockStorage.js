/**
 * Storage abstraction for the demo guest data.
 * - Persistent account database (mock) is stored in localStorage.
 * - Active authenticated session is stored in sessionStorage so fresh browser sessions start at login.
 * - Dedicated resetDemoData() clears only application-namespaced keys.
 *
 * DATA_VERSION tracks the schema generation. When incremented, all existing
 * guest accounts and sessions from the previous generation are cleared once
 * on first load. This satisfies Requirement 2: "Delete existing demo accounts."
 *
 * Current version: 3 (glass balls + brands edition)
 */

const DATA_VERSION    = 3;
const VERSION_KEY     = 'adt_demo_data_version';

const STORAGE_KEYS = {
  GUESTS:               'adt_demo_guests_v2',
  ORDER_SEQ:            'adt_demo_order_seq_counter',
  LEGACY_CURRENT_GUEST: 'adt_demo_current_guest_id', // for cleanup
};

const SESSION_KEYS = {
  CURRENT_GUEST: 'adt_session_guest_id',
  CART:          'adt_session_cart',
};

/**
 * One-time migration: if the stored version is older than DATA_VERSION,
 * purge all app-namespaced keys and stamp the new version.
 * Runs at module load time (once per browser session bootstrap).
 */
function runMigrationIfNeeded() {
  try {
    const stored = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
    if (stored < DATA_VERSION) {
      // Clear all app-namespaced data
      localStorage.removeItem(STORAGE_KEYS.GUESTS);
      localStorage.removeItem('adt_demo_guests_v1');
      localStorage.removeItem(STORAGE_KEYS.ORDER_SEQ);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_CURRENT_GUEST);
      sessionStorage.removeItem(SESSION_KEYS.CURRENT_GUEST);
      sessionStorage.removeItem(SESSION_KEYS.CART);
      // Stamp new version so this only runs once
      localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
      console.info(`[AutoPack] Demo data reset to version ${DATA_VERSION}. All previous guest accounts cleared.`);
    }
  } catch (e) {
    console.warn('[AutoPack] Migration check failed', e);
  }
}

// Run migration immediately when this module is first imported
runMigrationIfNeeded();

export const mockStorage = {
  getGuests() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GUESTS);
      if (data) return JSON.parse(data);

      // Check legacy key if exists
      const legacyData = localStorage.getItem('adt_demo_guests_v1');
      if (legacyData) {
        return JSON.parse(legacyData);
      }
      return {};
    } catch (e) {
      console.warn('Storage read failed', e);
      return {};
    }
  },

  saveGuests(guests) {
    try {
      localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  },

  // Session-scoped authentication
  getCurrentGuestId() {
    try {
      // Clean up any legacy persistent current-guest key to avoid auto-login
      if (localStorage.getItem(STORAGE_KEYS.LEGACY_CURRENT_GUEST)) {
        localStorage.removeItem(STORAGE_KEYS.LEGACY_CURRENT_GUEST);
      }
      return sessionStorage.getItem(SESSION_KEYS.CURRENT_GUEST) || null;
    } catch {
      return null;
    }
  },

  setCurrentGuestId(guestId) {
    try {
      if (guestId) {
        sessionStorage.setItem(SESSION_KEYS.CURRENT_GUEST, guestId);
      } else {
        sessionStorage.removeItem(SESSION_KEYS.CURRENT_GUEST);
      }
    } catch (e) {
      console.warn('Failed to set current guest session', e);
    }
  },

  getNextOrderSequence() {
    try {
      const current = parseInt(localStorage.getItem(STORAGE_KEYS.ORDER_SEQ) || '1', 10);
      localStorage.setItem(STORAGE_KEYS.ORDER_SEQ, String(current + 1));
      return current;
    } catch {
      return Date.now() % 100000;
    }
  },

  resetDemoData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.GUESTS);
      localStorage.removeItem('adt_demo_guests_v1');
      localStorage.removeItem(STORAGE_KEYS.ORDER_SEQ);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_CURRENT_GUEST);
      // Keep VERSION_KEY so migration does not re-trigger; version stays current
      sessionStorage.removeItem(SESSION_KEYS.CURRENT_GUEST);
      sessionStorage.removeItem(SESSION_KEYS.CART);
      return true;
    } catch (e) {
      console.warn('Failed to reset demo data', e);
      return false;
    }
  },
};
