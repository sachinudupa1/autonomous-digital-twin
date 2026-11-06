import { CheckCircleIcon, CloseIcon } from '../common/Icons';
import { ORDER_STATUS_STEPS } from '../../constants/config';

export function OrderStatusStepper({ status, showNotice = true }) {
  if (status === 'Cancelled') {
    return (
      <div className="p-3 rounded-xl bg-pink-50 border border-[#FF4F9A] flex items-center gap-2.5 text-xs font-bold text-[#FF4F9A]">
        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
          <CloseIcon className="w-3.5 h-3.5" />
        </div>
        <span>Order Cancelled — Full refund credited back to wallet</span>
      </div>
    );
  }

  const stepKeys = ['Order Received', 'Queued', 'Packing', 'Completed'];
  const currentIndex = Math.max(0, stepKeys.indexOf(status));

  return (
    <div className="w-full space-y-3">
      {/* 4-Step Stepper */}
      <div className="grid grid-cols-4 relative py-2">
        {/* Connecting Progress Line */}
        <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-slate-200 -z-0">
          <div
            className="h-full bg-[#16A34A] transition-all duration-300"
            style={{
              width: `${(currentIndex / (stepKeys.length - 1)) * 100}%`,
            }}
          />
        </div>

        {ORDER_STATUS_STEPS.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <div key={step.key} className="flex flex-col items-center text-center z-10 px-1">
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                  isDone
                    ? 'bg-[#16A34A] border-[#16A34A] text-white'
                    : isCurrent
                    ? 'bg-[#16A34A] border-[#16A34A] text-white ring-3 ring-green-100'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px]">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-bold mt-1.5 leading-tight ${
                  isCurrent
                    ? 'text-slate-900 font-black'
                    : isDone
                    ? 'text-[#16A34A]'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Unobtrusive Live Integration Note per Part 8 */}
      {showNotice && status !== 'Completed' && (
        <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center font-medium">
          ℹ️ Live production tracking will become available once the production system is connected.
        </div>
      )}
    </div>
  );
}
