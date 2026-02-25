// Reusable Button Component - Spy noir theme

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}) {
  const baseStyles =
    "px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed tracking-wide uppercase text-sm";

  const variants = {
    primary:
      "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white shadow-glow-red hover:shadow-glow-red-lg",
    secondary:
      "bg-gradient-to-r from-dark-lighter to-dark-light text-red-400 border border-red-800/40 hover:border-red-600/60 hover:text-red-300",
    outline:
      "border-2 border-red-800/50 text-red-400 hover:bg-red-900/20 hover:border-red-600/60 hover:text-red-300",
    danger:
      "bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-900/50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
