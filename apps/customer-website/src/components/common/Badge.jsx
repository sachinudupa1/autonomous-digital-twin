export function Badge({ variant = 'blue', children, className = '', size = 'md' }) {
  const colorMap = {
    orange: 'bg-orange-50 text-[#FF7900] border border-[#FF7900]',
    green: 'bg-green-50 text-[#16A34A] border border-[#16A34A]',
    blue: 'bg-blue-50 text-[#1677FF] border border-[#1677FF]',
    pink: 'bg-pink-50 text-[#FF4F9A] border border-[#FF4F9A]',
    yellow: 'bg-yellow-50 text-slate-900 border border-[#FFD400]',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-300',
    'solid-orange': 'bg-[#FF7900] text-white',
    'solid-green': 'bg-[#16A34A] text-white',
    'solid-blue': 'bg-[#1677FF] text-white',
    'solid-pink': 'bg-[#FF4F9A] text-white',
    'solid-yellow': 'bg-[#FFD400] text-slate-900',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-bold',
    md: 'text-xs font-bold px-2.5 py-0.5',
    lg: 'text-xs sm:text-sm font-bold px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${
        colorMap[variant] || colorMap.blue
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {children}
    </span>
  );
}
