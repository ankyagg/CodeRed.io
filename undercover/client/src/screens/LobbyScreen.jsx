"use client";
import { motion, AnimatePresence } from "framer-motion";
import { SpyDossier } from "../components/ui/SpyDossier";
import { Meteors } from "../components/ui/Meteors";
import { Shield, Loader2, Play, Power, CheckCircle2 } from "lucide-react";
import PlayerAvatar from "../components/PlayerAvatar";
import { cn } from "../lib/utils";

export default function LobbyScreen({
  room,
  myPlayerId,
  onToggleReady,
  onStartGame,
}) {
  const me = room.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost;
  const allReady = room.players.every((p) => p.isHost || p.isReady);
  const canStart = room.players.length >= 3 && allReady;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative overflow-hidden">
      <Meteors number={30} />

      <div className="w-full max-w-6xl relative z-10 grid md:grid-cols-3 gap-6 md:gap-8 max-h-[90vh] h-full items-start overflow-hidden">

        {/* Left Side: Room Info */}
        <div className="md:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-500 font-orbitron text-[10px] tracking-[0.3em] uppercase">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Live Secure Channel
            </div>
            <h1 className="text-4xl font-black font-orbitron text-white leading-tight">
              MISSION:<br />
              <span className="text-cyan-500 uppercase tracking-tighter">{room.roomName}</span>
            </h1>

            <SpyDossier title="Status Report">
              <div className="space-y-4 py-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">ENCRYPTION</span>
                  <span className="text-cyan-400 font-bold font-orbitron">AES-256</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">ACTIVE AGENTS</span>
                  <span className="text-white font-bold font-orbitron">{room.players.length}/10</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">PROTOCOL</span>
                  <span className="text-rose-400 font-bold font-orbitron">UNDERCOVER</span>
                </div>
              </div>
            </SpyDossier>

            {room.players.length < 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3 items-start"
              >
                <Shield size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose-200/70 font-medium uppercase tracking-wider leading-relaxed">
                  Insufficient resources. Minimum 3 agents required to authorize mission start.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Right Side: Agents List */}
        <div className="md:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] md:max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar"
          >
            {room.players.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "relative group overflow-hidden rounded-2xl border transition-all duration-300",
                  player.id === myPlayerId ? "bg-cyan-500/5 border-cyan-500/30" : "bg-zinc-900/50 border-zinc-800",
                  player.isReady || player.isHost ? "border-cyan-500/40" : "border-zinc-800"
                )}
              >
                <div className="p-4 flex items-center gap-4 relative z-10">
                  <PlayerAvatar player={player} size="sm" className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-orbitron text-sm font-bold text-white truncate uppercase">
                        {player.name}
                      </span>
                      {player.isHost && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold uppercase">HOST</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                      {player.id === myPlayerId ? "YOU (ACTIVE_AGENT)" : `AGENT_${idx.toString().padStart(2, '0')}`}
                    </div>
                  </div>
                  {(player.isReady || player.isHost) ? (
                    <CheckCircle2 size={18} className="text-cyan-500" />
                  ) : (
                    <Loader2 size={18} className="text-zinc-700 animate-spin" />
                  )}
                </div>

                {/* Visual scan line for current player */}
                {player.id === myPlayerId && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/30 animate-scan-y" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            {!isHost ? (
              <button
                onClick={onToggleReady}
                className={cn(
                  "flex-1 py-4 px-8 rounded-2xl font-orbitron text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3",
                  me?.isReady
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                    : "bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-600/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                )}
              >
                <Power size={18} />
                {me?.isReady ? "Cancel Readiness" : "Confirm Readiness"}
              </button>
            ) : (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className={cn(
                  "flex-1 py-4 px-8 rounded-2xl font-orbitron text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3",
                  canStart
                    ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-600/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                    : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                )}
              >
                {canStart ? <Play size={18} /> : <Loader2 size={18} className="animate-spin" />}
                {canStart ? "Authorize Mission Start" : "Awaiting Authorization"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
