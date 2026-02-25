"use client";
import { motion } from "framer-motion";
import { SpyDossier } from "../components/ui/SpyDossier";
import { Trophy, Ghost, Shield, AlertCircle, RefreshCw } from "lucide-react";
import PlayerAvatar from "../components/PlayerAvatar";
import { cn } from "../lib/utils";

export default function GameEndScreen({ winner, reason, players, trueWord }) {
  const imposters = players.filter((p) => p.isImposter);
  const civilians = players.filter((p) => !p.isImposter);

  return (
    <div className="min-h-screen p-6 bg-black relative flex items-center justify-center overflow-hidden">
      {/* Background static/grain */}
      <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10 space-y-12">

        {/* Header Section */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className={cn(
              "w-24 h-24 mx-auto rounded-full flex items-center justify-center border-2 shadow-[0_0_50px_rgba(var(--primary),0.3)]",
              winner === "CIVILIANS" ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-rose-500/20 border-rose-500 text-rose-400"
            )}
          >
            {winner === "CIVILIANS" ? <Trophy size={48} /> : <Ghost size={48} />}
          </motion.div>

          <div className="space-y-2">
            <div className="text-zinc-500 font-orbitron text-[10px] tracking-[0.5em] uppercase">Status: Terminal</div>
            <h1 className="text-6xl font-black font-orbitron text-white tracking-tighter">
              {winner === "CIVILIANS" ? (
                <span>AGENTS <span className="text-cyan-500">TRIUMPH</span></span>
              ) : (
                <span>MOLES <span className="text-rose-500">PREVAIL</span></span>
              )}
            </h1>
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest max-w-md mx-auto">{reason}</p>
          </div>
        </div>

        {/* Core Intel Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SpyDossier title="DECLASSIFIED INTEL" className="max-w-md mx-auto">
            <div className="text-center py-4 space-y-2">
              <div className="text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest">Master Keyphrase</div>
              <div className="text-5xl font-black font-orbitron text-white text-glow shadow-[0_0_20px_rgba(255,255,255,0.1)] uppercase">
                {trueWord}
              </div>
            </div>
          </SpyDossier>
        </motion.div>

        {/* Squad Breakdown */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Civilians */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-500 font-orbitron text-[10px] tracking-widest uppercase px-1">
              <Shield size={14} />
              Loyal Operatives
            </div>
            <div className="space-y-3">
              {civilians.map((player) => (
                <div key={player.id} className={cn(
                  "p-4 rounded-2xl bg-zinc-900/50 border flex items-center gap-4 transition-all",
                  player.isAlive ? "border-zinc-800" : "border-rose-900/30 opacity-60 grayscale"
                )}>
                  <PlayerAvatar player={player} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white uppercase font-orbitron">{player.name}</span>
                      {!player.isAlive && <span className="text-[8px] font-bold text-rose-500 font-orbitron border border-rose-500/30 px-1.5 py-0.5 rounded">KIA</span>}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-medium">CODE: {player.word}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Moles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-500 font-orbitron text-[10px] tracking-widest uppercase px-1">
              <AlertCircle size={14} />
              Double Agents
            </div>
            <div className="space-y-3">
              {imposters.map((player) => (
                <div key={player.id} className={cn(
                  "p-4 rounded-2xl bg-zinc-900/50 border flex items-center gap-4 transition-all",
                  player.isAlive ? "border-rose-500/20 shadow-[0_0_15px_rgba(225,29,72,0.1)]" : "border-zinc-800 opacity-60 grayscale"
                )}>
                  <PlayerAvatar player={player} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white uppercase font-orbitron">{player.name}</span>
                      {!player.isAlive && <span className="text-[8px] font-bold text-rose-500 font-orbitron border border-rose-500/30 px-1.5 py-0.5 rounded">EXPOSED</span>}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-medium">FAKE_CODE: {player.word}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8">
          <div className="flex items-center justify-center gap-3 text-zinc-700 font-orbitron text-[10px] uppercase tracking-[0.4em] animate-pulse">
            <RefreshCw size={12} className="animate-spin-slow" />
            Returning Home...
          </div>
        </div>
      </div>
    </div>
  );
}
