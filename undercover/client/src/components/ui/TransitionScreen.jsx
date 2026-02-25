"use client";
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

export const TransitionScreen = ({ onComplete }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        // Safety timeout to ensure transition always ends after 6 seconds max
        const safetyTimeout = setTimeout(() => {
            onComplete();
        }, 6000);

        const tl = gsap.timeline({
            onComplete: () => {
                clearTimeout(safetyTimeout);
                setTimeout(onComplete, 500);
            }
        });

        // Title flicker
        tl.fromTo(".transition-title",
            { opacity: 0, scale: 1.1 },
            { opacity: 1, scale: 1, duration: 1.5, ease: "power4.out" }
        );

        tl.to(".transition-title", {
            opacity: 0.5,
            duration: 0.1,
            repeat: 7,
            yoyo: true,
            ease: "none"
        }, "-=0.3");

        tl.to(".transition-title", {
            textShadow: "0 0 30px rgba(225, 29, 72, 1), 0 0 60px rgba(225, 29, 72, 0.4)",
            color: "#e11d48",
            duration: 0.8
        }, "-=0.5");

        tl.to(".transition-overlay", {
            opacity: 1,
            duration: 1.2,
            ease: "power2.inOut"
        }, "+=0.5");

        // Spore animation
        const spores = document.querySelectorAll(".spore");
        spores.forEach((spore) => {
            gsap.to(spore, {
                x: "random(-100, 100)",
                y: "random(-100, 100)",
                duration: "random(2, 4)",
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });

        return () => clearTimeout(safetyTimeout);
    }, [onComplete]);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        >
            {/* Murky background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.05)_0%,black_100%)] opacity-80" />

            {/* Spores/Particles */}
            {[...Array(40)].map((_, i) => (
                <div
                    key={i}
                    className="spore absolute w-1 h-1 bg-zinc-600 rounded-full opacity-30 blur-[1px]"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                    }}
                />
            ))}

            <div className="relative text-center z-10 px-4">
                <motion.h1
                    className="transition-title text-6xl md:text-9xl font-black font-orbitron tracking-tighter text-white select-none whitespace-nowrap"
                >
                    UNDER<span className="text-zinc-400">COVER</span>
                </motion.h1>

                <div className="mt-12 flex justify-center gap-2">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
            </div>

            {/* Dark vignette overlay that builds up */}
            <div className="transition-overlay absolute inset-0 bg-black opacity-0 pointer-events-none" />
        </motion.div>
    );
};
