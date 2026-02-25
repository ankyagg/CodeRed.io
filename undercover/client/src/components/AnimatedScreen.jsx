// A wrapper component that plays a subtle entrance animation on mount

import { useRef, useEffect } from "react";

export default function AnimatedScreen({ children, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    import("gsap").then(({ gsap }) => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" },
      );
    });
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
