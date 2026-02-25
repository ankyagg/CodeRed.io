"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpyDossier } from "../components/ui/SpyDossier";
import { TextGenerateEffect } from "../components/ui/TextGenerateEffect";
import { ShieldAlert, Eye, Lock, Fingerprint, Activity } from "lucide-react";
import { cn } from "../lib/utils";

export default function WordRevealScreen({ word, matchPercentage, intel }) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Background scanning lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="w-full h-[1px] bg-cyan-500 absolute"
            style={{ top: `${i * 5}%` }}
          />
        ))}
        <div className="w-full h-1/4 bg-gradient-to-b from-transparent via-cyan-500 to-transparent absolute animate-scan-y top-0" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 text-rose-500 font-orbitron text-xs tracking-[0.4em] uppercase mb-4"
          >
            <ShieldAlert size={20} className="animate-pulse" />
            Eyes Only // Level 5 Clearance
          </motion.div>
          <h1 className="text-4xl font-black font-orbitron text-white">
            MISSION <span className="text-cyan-500">BRIEFING</span>
          </h1>
        </div>

        <div className="grid gap-6">
          <SpyDossier title="DECRYPTION MODULE">
            <div className="space-y-8 py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest">Target Codebase</div>
                <div className="relative group">
                  <AnimatePresence mode="wait">
                    {!isRevealed ? (
                      <motion.div
                        key="locked"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="flex flex-col items-center gap-3 py-10"
                      >
                        <Lock size={48} className="text-zinc-800 animate-pulse" />
                        <div className="text-sm font-orbitron text-zinc-800 tracking-widest">DECRYPTING...</div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="revealed"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="absolute -inset-10 bg-cyan-500/10 blur-3xl rounded-full" />
                        <div className="text-6xl md:text-8xl font-black font-orbitron text-white text-glow drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                          {word}
                        </div>
                        <div className="flex items-center gap-2 text-cyan-400/60 font-orbitron text-[10px] uppercase tracking-widest mt-4">
                          <Fingerprint size={14} />
                          Identity Verified
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-2 text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest mb-1">
                    <Activity size={12} className="text-cyan-500" />
                    Match Variance
                  </div>
                  <div className={cn(
                    "text-2xl font-black font-orbitron",
                    matchPercentage < 70 ? "text-rose-500" : matchPercentage < 85 ? "text-amber-500" : "text-cyan-400"
                  )}>
                    {matchPercentage}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-2 text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest mb-1">
                    <Eye size={12} className="text-rose-500" />
                    Exposure Risk
                  </div>
                  <div className="text-2xl font-black font-orbitron text-zinc-200">
                    LOW
                  </div>
                </div>
              </div>
            </div>
          </SpyDossier>

          {intel && isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <SpyDossier title="FIELD INTEL // CONFIDENTIAL" className="border-rose-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 font-medium leading-relaxed">
                      Advanced surveillance suggests agent <span className="text-white font-bold">{intel.targetPlayerName}</span>
                      {" "}is displaying patterns consistent with <span className="text-cyan-400 font-bold uppercase">Civilian</span> activity.
                    </div>
                    <div className="text-[10px] text-zinc-600 font-orbitron uppercase mt-2">Source: Deep_Signal_Intercept</div>
                  </div>
                </div>
              </SpyDossier>
            </motion.div>
          )}

          <div className="flex justify-center flex-col items-center gap-2 mt-4 text-zinc-700 font-orbitron text-[10px] uppercase tracking-[0.2em]">
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            Awaiting Command Authority
          </div>
        </div>
      </div>
    </div>
  );
}
