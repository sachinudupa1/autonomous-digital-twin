import { LightningIcon } from '../common/Icons';

export function RushCountdown({ order }) {
  if (order.orderType !== 'Rush') return null;

  const deadlineMinutes = order.rushDeadlineMinutes || 5;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-[#FFD400]">
      <LightningIcon className="w-3.5 h-3.5 text-[#FF7900] shrink-0" />
      <span>
        Rush Target: {deadlineMinutes} mins priority
      </span>
    </div>
  );
}
