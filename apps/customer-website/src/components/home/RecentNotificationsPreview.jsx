import { ArrowRightIcon } from '../common/Icons';
import { formatTimeOnly } from '../../utils/formatters';

export function RecentNotificationsPreview({ notifications = [], onNavigate }) {
  const recent = notifications.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-sm font-black text-slate-900 tracking-tight">
          Recent Notifications
        </h3>
        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          className="text-xs font-bold text-[#1677FF] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View All</span>
          <ArrowRightIcon className="w-3 h-3" />
        </button>
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">
          No notifications recorded yet.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {recent.map((n) => {
            const dotColor =
              n.category === 'wallet' || n.category === 'refund'
                ? 'bg-[#16A34A]'
                : n.category === 'order'
                ? 'bg-[#1677FF]'
                : 'bg-[#FF7900]';

            return (
              <div
                key={n.id}
                onClick={() => onNavigate('notifications')}
                className="py-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors rounded-lg px-1.5"
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {n.description}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono mt-0.5">
                  {formatTimeOnly(n.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
