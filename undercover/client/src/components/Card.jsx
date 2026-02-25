// Card Component - Dark noir spy theme

export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-dark-light/90 backdrop-blur-md rounded-2xl p-6 border border-red-900/30 shadow-glow-red ${className}`}
    >
      {children}
    </div>
  );
}
