export function Button({
  children,
  variant = 'orange',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  icon = null,
  fullWidth = false,
  ...props
}) {
  const variantStyles = {
    // Solid Bright Brand Accents (Strict 5-colour palette)
    orange: 'bg-[#FF7900] hover:bg-[#E56D00] text-white border border-[#FF7900] shadow-xs',
    green: 'bg-[#16A34A] hover:bg-[#15803D] text-white border border-[#16A34A] shadow-xs',
    blue: 'bg-[#1677FF] hover:bg-[#0958D9] text-white border border-[#1677FF] shadow-xs',
    pink: 'bg-[#FF4F9A] hover:bg-[#E03D84] text-white border border-[#FF4F9A] shadow-xs',
    yellow: 'bg-[#FFD400] hover:bg-[#E6BE00] text-slate-900 border border-[#FFD400] shadow-xs',

    // Clean Outlines
    'outline-orange': 'bg-white hover:bg-orange-50 text-[#FF7900] border border-[#FF7900]',
    'outline-green': 'bg-white hover:bg-green-50 text-[#16A34A] border border-[#16A34A]',
    'outline-blue': 'bg-white hover:bg-blue-50 text-[#1677FF] border border-[#1677FF]',
    'outline-pink': 'bg-white hover:bg-pink-50 text-[#FF4F9A] border border-[#FF4F9A]',
    'outline-yellow': 'bg-white hover:bg-yellow-50 text-slate-800 border border-[#FFD400]',

    // Neutral & Utilities
    secondary: 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent',
    danger: 'bg-white hover:bg-pink-50 text-[#FF4F9A] border border-[#FF4F9A]',
  };

  // Compact proportionate sizing per Part 6
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs font-semibold rounded-lg',
    md: 'h-10 px-4 text-xs sm:text-sm font-bold rounded-xl',
    lg: 'h-11 px-5 text-sm font-bold rounded-xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] ${
        variantStyles[variant] || variantStyles.orange
      } ${sizeStyles[size] || sizeStyles.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  );
}
