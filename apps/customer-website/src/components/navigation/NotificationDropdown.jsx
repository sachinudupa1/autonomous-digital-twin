import { useState, useRef, useEffect } from 'react';
import { BellIcon, CheckCircleIcon } from '../common/Icons';
import { useAuth } from '../../hooks/useAuth';
import { customerService } from '../../services/interfaces';
import { formatTimeOnly } from '../../utils/formatters';

export function NotificationDropdown({ onNavigate }) {
  const { currentGuest, refreshGuest } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = currentGuest?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  const handleMarkAsRead = (notifId, e) => {
    e.stopPropagation();
    if (currentGuest?.guestId) {
      customerService.markNotificationAsRead(currentGuest.guestId, notifId);
      refreshGuest();
    }
  };

  const handleMarkAllRead = () => {
    if (currentGuest?.guestId) {
      customerService.markAllNotificationsAsRead(currentGuest.guestId);
      refreshGuest();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition-all cursor-pointer text-slate-700 hover:text-[#FF7900]"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#FF4F9A] text-[10px] font-black text-white border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in duration-100">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Notifications</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {unreadCount} unread
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-[#1677FF] hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {recentNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No notifications on record.
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) handleMarkAsRead(n.id, { stopPropagation: () => {} });
                  }}
                  className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5 ${
                    !n.read ? 'bg-orange-50/40' : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      !n.read ? 'bg-[#FF7900]' : 'bg-transparent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formatTimeOnly(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                      {n.description}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="text-slate-300 hover:text-[#16A34A] p-0.5 cursor-pointer shrink-0"
                      title="Mark as read"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/50 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('notifications');
              }}
              className="text-xs font-bold text-[#1677FF] hover:underline cursor-pointer"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
