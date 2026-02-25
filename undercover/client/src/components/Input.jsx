// Input Component - Spy noir theme

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  className = "",
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full px-4 py-3 bg-dark/80 border border-red-900/30 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-800/50 focus:border-red-700/50 transition-all duration-300 ${className}`}
    />
  );
}
