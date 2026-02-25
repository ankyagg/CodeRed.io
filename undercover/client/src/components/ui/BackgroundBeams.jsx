"use client";
import React from "react";
import { cn } from "../../lib/utils";

export const BackgroundBeams = ({ className }) => {
    return (
        <div
            className={cn(
                "absolute inset-0 z-0 h-full w-full overflow-hidden bg-black",
                className
            )}
        >
            {/* Primary Glows - increased visibility and wider spread */}
            <div className="absolute top-[-20%] left-[-10%] h-[80%] w-[80%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse opacity-60" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[80%] w-[80%] bg-rose-500/10 blur-[150px] rounded-full animate-pulse opacity-60" style={{ animationDelay: "1.5s" }} />

            {/* Central "Hub" Glow - helps connect the two sides */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)] pointer-events-none" />

            {/* Grid Overlay - more subtle but consistent */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Scanning laser line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-scan-y opacity-50" />

            {/* Technical Dot Pattern */}
            <div className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            />

            <div className="absolute inset-0 bg-noise opacity-[0.1]"></div>
        </div>
    );
};
