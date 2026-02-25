"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const TextGenerateEffect = ({
    words,
    className,
    duration = 0.5,
}) => {
    const characters = words.split("");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 1500); // Wait for title typewriter
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={cn("font-medium", className)}>
            <div className="mt-4">
                <div className="text-zinc-400 leading-snug tracking-wide">
                    {characters.map((char, idx) => {
                        return (
                            <motion.span
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={isReady ? { opacity: 1 } : {}}
                                transition={{
                                    duration: 0.05,
                                    delay: idx * 0.02,
                                }}
                                className="inline text-zinc-400"
                            >
                                {char}
                            </motion.span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
