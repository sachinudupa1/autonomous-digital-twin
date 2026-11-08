/**
 * Mock Service Adapter for the AutoPack Customer Website.
 * Implements demo operations: Guest Auth, Wallet, Orders, Cancellations, Refunds, and Notifications.
 *
 * Note: Fabricated automated order completion and simulated delay progression have been
 * completely removed per requirements. Orders remain in their true known status (Order Received)
 * until a real backend/Digital Twin integration provides status updates.
 */

import {
  INITIAL_WALLET_BALANCE,
  RECHARGE_AMOUNTS,
  RUSH_SURCHARGE_PERCENT,
  ORDER_STATUSES,
  GUEST_ID_REGEX,
} from '../../constants/config';
import { formatOrderId } from '../../utils/formatters';
import { mockStorage } from './mockStorage';

class MockServiceAdapter {
  constructor() {
    this.subscribers = new Set();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event) {
    this.subscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (e) {
        console.error('Subscriber callback error', e);
      }
    });
  }

  getGuest(guestId) {
    if (!guestId) return null;
    const guests = mockStorage.getGuests();
    return guests[guestId] || null;
  }

  saveGuest(guestData) {
    if (!guestData || !guestData.guestId) return;
    const guests = mockStorage.getGuests();
    guests[guestData.guestId] = guestData;
    mockStorage.saveGuests(guests);
    this.notifySubscribers({ type: 'GUEST_UPDATED', guestId: guestData.guestId });
  }

  // --- Auth Operations ---

  registerGuest(guestId) {
    const trimmedId = (guestId || '').trim();

    if (!GUEST_ID_REGEX.test(trimmedId)) {
      throw new Error('Invalid Guest ID format. Must be "Guest_" followed by numbers (e.g. Guest_1, Guest_12).');
    }

    const existing = this.getGuest(trimmedId);
    if (existing) {
      throw new Error('Guest ID already taken. Please choose another ID or sign in as returning user.');
    }

    const now = new Date().toISOString();
    const initialTransaction = {
      id: `TXN_${Date.now()}_INIT`,
      dateTime: now,
      type: 'Credit',
      description: 'Initial guest account welcome balance credit',
      amount: INITIAL_WALLET_BALANCE,
      balanceAfter: INITIAL_WALLET_BALANCE,
      relatedOrderId: null,
    };

    const welcomeNotification = {
      id: `NOTIF_${Date.now()}_WELCOME`,
      title: 'Welcome to AutoPack Customer Portal!',
      description: `Your guest account ${trimmedId} has been created. A starting demonstration balance of ₹10,000 has been credited to your wallet.`,
      timestamp: now,
      category: 'account',
      read: false,
    };

    const newGuest = {
      guestId: trimmedId,
      registeredAt: now,
      walletBalance: INITIAL_WALLET_BALANCE,
      orders: [],
      transactions: [initialTransaction],
      notifications: [welcomeNotification],
      activity: [
        {
          id: `ACT_${Date.now()}_REG`,
          timestamp: now,
          type: 'REGISTER',
          description: `Account ${trimmedId} registered with starting balance ₹10,000`,
        },
      ],
    };

    this.saveGuest(newGuest);
    mockStorage.setCurrentGuestId(trimmedId);
    return newGuest;
  }

  loginGuest(guestId) {
    const trimmedId = (guestId || '').trim();

    if (!GUEST_ID_REGEX.test(trimmedId)) {
      throw new Error('Invalid Guest ID format. Expected format: Guest_1, Guest_2, etc.');
    }

    const guest = this.getGuest(trimmedId);
    if (!guest) {
      throw new Error(`Guest ID "${trimmedId}" does not exist. Please register first.`);
    }

    const now = new Date().toISOString();
    guest.activity = guest.activity || [];
    guest.activity.unshift({
      id: `ACT_${Date.now()}_LOGIN`,
      timestamp: now,
      type: 'LOGIN',
      description: `Signed in as ${trimmedId}`,
    });

    guest.notifications = guest.notifications || [];
    guest.notifications.unshift({
      id: `NOTIF_${Date.now()}_LOGIN`,
      title: 'Welcome Back!',
      description: `Active session restored for ${trimmedId}. Your wallet balance is ready.`,
      timestamp: now,
      category: 'account',
      read: false,
    });

    this.saveGuest(guest);
    mockStorage.setCurrentGuestId(trimmedId);
    return guest;
  }

  logoutGuest() {
    mockStorage.setCurrentGuestId(null);
    this.notifySubscribers({ type: 'LOGOUT' });
    return true;
  }

  getCurrentSession() {
    const currentId = mockStorage.getCurrentGuestId();
    if (!currentId) return null;
    return this.getGuest(currentId);
  }

  resetDemoData() {
    const success = mockStorage.resetDemoData();
    this.notifySubscribers({ type: 'RESET_DATA' });
    return success;
  }

  // --- Wallet Operations ---

  rechargeWallet(guestId, amount) {
    const parsedAmount = Number(amount);
    if (!RECHARGE_AMOUNTS.includes(parsedAmount)) {
      throw new Error(`Invalid recharge amount. Allowed amounts: ${RECHARGE_AMOUNTS.join(', ')}`);
    }

    const guest = this.getGuest(guestId);
    if (!guest) throw new Error('Guest account not found.');

    const now = new Date().toISOString();
    const newBalance = guest.walletBalance + parsedAmount;

    const txn = {
      id: `TXN_${Date.now()}_RECHARGE`,
      dateTime: now,
      type: 'Credit',
      description: `Demo Wallet Recharge of ₹${parsedAmount.toLocaleString('en-IN')}`,
      amount: parsedAmount,
      balanceAfter: newBalance,
      relatedOrderId: null,
    };

    const notif = {
      id: `NOTIF_${Date.now()}_RECHARGE`,
      title: 'Wallet Recharge Successful',
      description: `₹${parsedAmount.toLocaleString('en-IN')} has been added to your wallet. New balance: ₹${newBalance.toLocaleString('en-IN')}.`,
      timestamp: now,
      category: 'wallet',
      read: false,
    };

    guest.walletBalance = newBalance;
    guest.transactions = guest.transactions || [];
    guest.transactions.unshift(txn);
    guest.notifications = guest.notifications || [];
    guest.notifications.unshift(notif);
    guest.activity = guest.activity || [];
    guest.activity.unshift({
      id: `ACT_${Date.now()}_RECH`,
      timestamp: now,
      type: 'RECHARGE',
      description: `Recharged wallet with ₹${parsedAmount.toLocaleString('en-IN')}`,
    });

    this.saveGuest(guest);
    return { guest, transaction: txn };
  }

  // --- Order Operations ---

  placeOrder(guestId, { items, orderType, rushDeadlineMinutes }) {
    const guest = this.getGuest(guestId);
    if (!guest) throw new Error('Guest account not found.');

    if (!items || items.length === 0) {
      throw new Error('Cannot place an empty order. Please add products to cart.');
    }

    const validItems = items.filter((item) => item.quantity > 0);
    if (validItems.length === 0) {
      throw new Error('At least one product must have a quantity greater than zero.');
    }

    // Calculate totals
    const productTotal = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const isRush = orderType === 'Rush';

    if (isRush && (!rushDeadlineMinutes || rushDeadlineMinutes < 3 || rushDeadlineMinutes > 7)) {
      throw new Error('A valid Rush deadline between 3 and 7 minutes is mandatory for Rush orders.');
    }

    const rushSurcharge = isRush ? Math.round(productTotal * RUSH_SURCHARGE_PERCENT) : 0;
    const finalAmountPaid = productTotal + rushSurcharge;

    if (guest.walletBalance < finalAmountPaid) {
      const shortage = finalAmountPaid - guest.walletBalance;
      throw new Error(`Insufficient wallet balance. You have ₹${guest.walletBalance.toLocaleString('en-IN')}, required ₹${finalAmountPaid.toLocaleString('en-IN')} (Shortage: ₹${shortage.toLocaleString('en-IN')}).`);
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const seq = mockStorage.getNextOrderSequence();
    const orderId = formatOrderId(seq, now.getFullYear());

    const newBalance = guest.walletBalance - finalAmountPaid;

    const newOrder = {
      orderId,
      guestId,
      items: validItems.map((item) => ({
        id: item.id,
        name: item.name,
        title: item.title,
        brand: item.brand || null,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        color: item.color,
      })),
      productTotal,
      orderType: isRush ? 'Rush' : 'Normal',
      rushSurcharge,
      finalAmountPaid,
      rushDeadlineMinutes: isRush ? rushDeadlineMinutes : null,
      rushDeadlineSeconds: isRush ? rushDeadlineMinutes * 60 : null,
      createdAt: nowIso,
      placedAtTimestamp: now.getTime(),
      status: ORDER_STATUSES.RECEIVED, // Always starts and remains at Order Received
      actualCompletionTime: null,       // No fabricated completion time
      isDelayPredicted: false,          // No fabricated delay flags
      deadlineMissed: false,
    };

    const paymentTxn = {
      id: `TXN_${Date.now()}_PAY`,
      dateTime: nowIso,
      type: 'Payment',
      description: `Payment for Order ${orderId} (${newOrder.orderType})`,
      amount: -finalAmountPaid,
      balanceAfter: newBalance,
      relatedOrderId: orderId,
    };

    const notif = {
      id: `NOTIF_${Date.now()}_ORDER_PLACED`,
      title: `Order Received: ${orderId}`,
      description: `Your ${newOrder.orderType} order for ${validItems.length} product(s) has been received. Total paid: ₹${finalAmountPaid.toLocaleString('en-IN')}.`,
      timestamp: nowIso,
      category: 'order',
      read: false,
    };

    guest.walletBalance = newBalance;
    guest.orders = guest.orders || [];
    guest.orders.unshift(newOrder);
    guest.transactions = guest.transactions || [];
    guest.transactions.unshift(paymentTxn);
    guest.notifications = guest.notifications || [];
    guest.notifications.unshift(notif);
    guest.activity = guest.activity || [];
    guest.activity.unshift({
      id: `ACT_${Date.now()}_ORD`,
      timestamp: nowIso,
      type: 'ORDER_PLACED',
      description: `Placed ${newOrder.orderType} order ${orderId} for ₹${finalAmountPaid.toLocaleString('en-IN')}`,
    });

    this.saveGuest(guest);
    return newOrder;
  }

  cancelOrder(guestId, orderId) {
    const guest = this.getGuest(guestId);
    if (!guest) throw new Error('Guest account not found.');

    const orderIndex = guest.orders.findIndex((o) => o.orderId === orderId);
    if (orderIndex === -1) throw new Error('Order not found.');

    const order = guest.orders[orderIndex];

    if (order.status === ORDER_STATUSES.PACKING) {
      throw new Error('Order cannot be cancelled because automated robotic packing has already started.');
    }
    if (order.status === ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot cancel an order that is already completed.');
    }
    if (order.status === ORDER_STATUSES.CANCELLED) {
      throw new Error('Order is already cancelled.');
    }

    const now = new Date().toISOString();
    const refundAmount = order.finalAmountPaid;
    const newBalance = guest.walletBalance + refundAmount;

    order.status = ORDER_STATUSES.CANCELLED;
    order.cancelledAt = now;

    const refundTxn = {
      id: `TXN_${Date.now()}_REFUND`,
      dateTime: now,
      type: 'Refund',
      description: `Full refund for cancelled order ${orderId} (incl. rush surcharge)`,
      amount: refundAmount,
      balanceAfter: newBalance,
      relatedOrderId: orderId,
    };

    const notif = {
      id: `NOTIF_${Date.now()}_CANCEL`,
      title: `Order Cancelled: ${orderId}`,
      description: `Order ${orderId} was cancelled. Full refund of ₹${refundAmount.toLocaleString('en-IN')} has been returned to your wallet.`,
      timestamp: now,
      category: 'refund',
      read: false,
    };

    guest.walletBalance = newBalance;
    guest.orders[orderIndex] = order;
    guest.transactions = guest.transactions || [];
    guest.transactions.unshift(refundTxn);
    guest.notifications = guest.notifications || [];
    guest.notifications.unshift(notif);
    guest.activity = guest.activity || [];
    guest.activity.unshift({
      id: `ACT_${Date.now()}_CANCEL`,
      timestamp: now,
      type: 'ORDER_CANCELLED',
      description: `Cancelled order ${orderId} and received ₹${refundAmount.toLocaleString('en-IN')} refund`,
    });

    this.saveGuest(guest);
    return { order, refundAmount, newBalance };
  }

  // Clean extension hook ready for future real backend / WebSocket updates
  updateOrderStatus(guestId, orderId, newStatus, actualCompletionTime = null) {
    const guest = this.getGuest(guestId);
    if (!guest || !guest.orders) return;

    const order = guest.orders.find((o) => o.orderId === orderId);
    if (!order) return;

    order.status = newStatus;
    if (actualCompletionTime) {
      order.actualCompletionTime = actualCompletionTime;
    }

    this.saveGuest(guest);
  }

  // --- Notification Operations ---

  markNotificationAsRead(guestId, notificationId) {
    const guest = this.getGuest(guestId);
    if (!guest || !guest.notifications) return;

    const notif = guest.notifications.find((n) => n.id === notificationId);
    if (notif && !notif.read) {
      notif.read = true;
      this.saveGuest(guest);
    }
  }

  markAllNotificationsAsRead(guestId) {
    const guest = this.getGuest(guestId);
    if (!guest || !guest.notifications) return;

    let modified = false;
    guest.notifications.forEach((n) => {
      if (!n.read) {
        n.read = true;
        modified = true;
      }
    });

    if (modified) {
      this.saveGuest(guest);
    }
  }
}

export const mockService = new MockServiceAdapter();
