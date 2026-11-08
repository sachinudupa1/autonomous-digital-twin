/**
 * Central Service Access Point.
 *
 * Provides unified interface for UI components.
 * Currently backed by MockServiceAdapter for the standalone frontend demo.
 * The backend teammate will replace or augment these methods with actual API calls later.
 */

import { mockService } from '../mock/mockAdapter';

export const customerService = {
  // Auth
  registerGuest: (guestId) => mockService.registerGuest(guestId),
  loginGuest: (guestId) => mockService.loginGuest(guestId),
  logoutGuest: () => mockService.logoutGuest(),
  getCurrentSession: () => mockService.getCurrentSession(),
  getGuest: (guestId) => mockService.getGuest(guestId),
  resetDemoData: () => mockService.resetDemoData(),

  // Wallet
  rechargeWallet: (guestId, amount) => mockService.rechargeWallet(guestId, amount),

  // Orders
  placeOrder: (guestId, orderParams) => mockService.placeOrder(guestId, orderParams),
  cancelOrder: (guestId, orderId) => mockService.cancelOrder(guestId, orderId),
  updateOrderStatus: (guestId, orderId, newStatus, actualCompletionTime) =>
    mockService.updateOrderStatus(guestId, orderId, newStatus, actualCompletionTime),

  // Notifications
  markNotificationAsRead: (guestId, notifId) => mockService.markNotificationAsRead(guestId, notifId),
  markAllNotificationsAsRead: (guestId) => mockService.markAllNotificationsAsRead(guestId),

  // Live Subscription
  subscribe: (callback) => mockService.subscribe(callback),
};
