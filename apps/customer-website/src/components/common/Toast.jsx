import { useToast } from '../../hooks/useToast';
import { CheckCircleIcon, AlertCircleIcon, CloseIcon } from './Icons';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const typeConfig = {
    success: {
      bg: 'bg-[#E6F7EA]',
      border: 'border-[#287A43]',
      text: 'text-[#287A43]',
      icon: <CheckCircleIcon className="w-5 h-5 text-[#287A43] shrink-0" />,
    },
    error: {
      bg: 'bg-[#FFE8F1]',
      border: 'border-[#B94F7B]',
      text: 'text-[#B94F7B]',
      icon: <AlertCircleIcon className="w-5 h-5 text-[#B94F7B] shrink-0" />,
    },
    warning: {
      bg: 'bg-[#FFF7D6]',
      border: 'border-[#A77A12]',
      text: 'text-[#A77A12]',
      icon: <AlertCircleIcon className="w-5 h-5 text-[#A77A12] shrink-0" />,
    },
    info: {
      bg: 'bg-[#E7F1FF]',
      border: 'border-[#3266B0]',
      text: 'text-[#3266B0]',
      icon: <CheckCircleIcon className="w-5 h-5 text-[#3266B0] shrink-0" />,
    },
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const config = typeConfig[toast.type] || typeConfig.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border-2 shadow-lg transition-all animate-in slide-in-from-bottom-2 ${config.bg} ${config.border}`}
          >
            {config.icon}
            <div className={`flex-1 text-sm font-medium ${config.text}`}>
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
