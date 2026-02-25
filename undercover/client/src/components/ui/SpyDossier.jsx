"use client";
import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

export const SpyDossier = ({ children, title, className }) => {
    const [displayTitle, setDisplayTitle] = useState("");

    useEffect(() => {
        if (!title) return;
        let i = 0;
        setDisplayTitle("");
        const interval = setInterval(() => {
            if (i < title.length) {
                setDisplayTitle(title.substring(0, i + 1));
                i++;
            } else {
                clearInterval(interval);
            }
        }, 50);
        return () => clearInterval(interval);
    }, [title]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative p-[1px] rounded-2xl overflow-hidden group",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 via-zinc-400 to-zinc-800 opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>

            <div className="relative bg-zinc-950/90 backdrop-blur-3xl p-6 rounded-[15px] flex flex-col gap-4 border border-white/5 shadow-2xl">
                <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                {title && (
                    <div className="border-b border-white/5 pb-3 mb-1 flex justify-between items-center relative z-10">
                        <h3 className="font-orbitron font-black text-cyan-400 uppercase tracking-[0.2em] text-[10px] min-h-[1em]">
                            {displayTitle}
                            <span className="animate-pulse">_</span>
                        </h3>
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-1 h-1 rounded-full bg-cyan-500/30 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative z-10">
                    {children}
                </div>

                <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
                    <div className="absolute top-0 left-0 w-[1px] h-3 bg-cyan-500/50" />
                    <div className="absolute top-0 left-0 w-3 h-[1px] bg-cyan-500/50" />
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
                    <div className="absolute bottom-0 right-0 w-[1px] h-3 bg-rose-500/50" />
                    <div className="absolute bottom-0 right-0 w-3 h-[1px] bg-rose-500/50" />
                </div>
            </div>
        </motion.div>
    );
};
