import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { customerService } from '../../services/interfaces';
import { formatDateTime } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import {
  BellIcon,
  CheckCircleIcon,
  WalletIcon,
  PackageIcon,
} from '../../components/common/Icons';

export function NotificationsPage() {
  const { currentGuest, refreshGuest } = useAuth();
  const { showToast } = useToast();

  const notifications = currentGuest?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id) => {
    if (currentGuest?.guestId) {
      customerService.markNotificationAsRead(currentGuest.guestId, id);
      refreshGuest();
    }
  };

  const handleMarkAllRead = () => {
    if (currentGuest?.guestId) {
      customerService.markAllNotificationsAsRead(currentGuest.guestId);
      refreshGuest();
      showToast('All notifications marked as read', 'info');
    }
  };

  const getCategoryConfig = (category) => {
    switch (category) {
      case 'wallet':
      case 'refund':
        return {
          icon: <WalletIcon className="w-3.5 h-3.5 text-[#16A34A]" />,
          badge: 'bg-green-50 text-[#16A34A] border-green-200',
          label: 'Wallet & Finance',
        };
      case 'order':
        return {
          icon: <PackageIcon className="w-3.5 h-3.5 text-[#1677FF]" />,
          badge: 'bg-blue-50 text-[#1677FF] border-blue-200',
          label: 'Packaging Line',
        };
      case 'account':
        return {
          icon: <CheckCircleIcon className="w-3.5 h-3.5 text-[#FF7900]" />,
          badge: 'bg-orange-50 text-[#FF7900] border-orange-200',
          label: 'Account Event',
        };
      default:
        return {
          icon: <BellIcon className="w-3.5 h-3.5 text-slate-500" />,
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          label: 'General Alert',
        };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-orange-50 text-[#FF7900] border border-orange-200 text-xs font-bold mb-1.5">
            <BellIcon className="w-3.5 h-3.5" />
            <span>Activity Feed</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Notifications & System Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological audit log of scheduling updates, wallet recharges, and order state events.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline-blue"
            size="sm"
            onClick={handleMarkAllRead}
            icon={<CheckCircleIcon className="w-3.5 h-3.5" />}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>All Notifications ({notifications.length})</span>
          <span>{unreadCount} unread</span>
        </div>

        {notifications.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 space-y-1">
            <div className="text-xl">🔔</div>
            <p>No notifications on record.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => {
              const config = getCategoryConfig(notif.category);

              return (
                <div
                  key={notif.id}
                  className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                    !notif.read ? 'bg-orange-50/20' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !notif.read ? 'bg-[#FF7900]' : 'bg-slate-300'
                      }`}
                    />

                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${config.badge}`}
                        >
                          {config.icon}
                          <span>{config.label}</span>
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          {notif.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {notif.description}
                      </p>

                      <span className="text-[10px] font-mono text-slate-400 block pt-0.5">
                        {formatDateTime(notif.timestamp)}
                      </span>
                    </div>
                  </div>

                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="self-end sm:self-center px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#16A34A] text-slate-600 hover:text-[#16A34A] text-[11px] font-bold transition-all cursor-pointer shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
