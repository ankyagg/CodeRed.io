"use client";

import { cn } from "../../lib/utils";
import { motion, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export const TypewriterEffect = ({
    words,
    className,
    cursorClassName,
}) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [complete, setComplete] = useState(false);
    const scopeRef = useRef(null);
    const isInView = useInView(scopeRef);

    // Split content by lines if needed, or words
    const wordsArray = words.map((word) => {
        return {
            ...word,
            text: word.text.split(""),
        };
    });

    useEffect(() => {
        if (!isInView || complete) return;

        let currentIdx = 0;
        let textIdx = 0;
        let timer;

        const type = () => {
            if (currentIdx >= wordsArray.length) {
                setComplete(true);
                return;
            }

            const word = wordsArray[currentIdx];
            if (textIdx < word.text.length) {
                setCurrentText((prev) => prev + word.text[textIdx]);
                textIdx++;
                timer = setTimeout(type, 80);
            } else {
                currentIdx++;
                textIdx = 0;
                setCurrentText((prev) => prev + " ");
                timer = setTimeout(type, 100);
            }
        };

        timer = setTimeout(type, 500);
        return () => clearTimeout(timer);
    }, [isInView, complete]);

    return (
        <div className={cn("flex space-x-1 my-6", className)} ref={scopeRef}>
            <div
                className="text-base sm:text-lg md:text-2xl lg:text-5xl font-bold"
                style={{
                    whiteSpace: "pre-wrap",
                }}
            >
                {words.map((word, idx) => {
                    return (
                        <span
                            key={`word-${idx}`}
                            className={cn("text-white ", word.className)}
                        >
                            {word.text}
                            {" "}
                        </span>
                    );
                })}
                {/* We use a motion span for the cursor */}
                <motion.span
                    initial={{
                        opacity: 0,
                    }}
                    animate={{
                        opacity: 1,
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                    }}
                    className={cn(
                        "inline-block rounded-sm w-[4px] h-4 md:h-6 lg:h-10 bg-cyan-500",
                        cursorClassName
                    )}
                ></motion.span>
            </div>
        </div>
    );
};

export const TypewriterEffectSmooth = ({
    words,
    className,
    cursorClassName,
}) => {
    // split text to words
    const wordsArray = words.map((word) => {
        return {
            ...word,
            text: word.text.split(""),
        };
    });
    const renderWords = () => {
        return (
            <div>
                {wordsArray.map((word, idx) => {
                    return (
                        <div key={`word-${idx}`} className="inline-block">
                            {word.text.map((char, index) => (
                                <span
                                    key={`char-${index}`}
                                    className={cn(`text-white `, word.className)}
                                >
                                    {char}
                                </span>
                            ))}
                            &nbsp;
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={cn("flex space-x-1 my-6", className)}>
            <motion.div
                className="overflow-hidden pb-2"
                initial={{
                    width: "0%",
                }}
                whileInView={{
                    width: "fit-content",
                }}
                transition={{
                    duration: 2,
                    ease: "linear",
                    delay: 1,
                }}
            >
                <div
                    className="text-xs sm:text-base md:text-xl lg:text-3xl xl:text-5xl font-bold font-orbitron"
                    style={{
                        whiteSpace: "nowrap",
                    }}
                >
                    {renderWords()}{" "}
                </div>
            </motion.div>
            <motion.span
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
                className={cn(
                    "block rounded-sm w-[4px] h-4 sm:h-6 xl:h-12 bg-cyan-500",
                    cursorClassName
                )}
            ></motion.span>
        </div>
    );
};
