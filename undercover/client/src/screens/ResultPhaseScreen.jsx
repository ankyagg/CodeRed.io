"use client";
import { motion } from "framer-motion";
import { SpyDossier } from "../components/ui/SpyDossier";
import { ShieldAlert, Skull, Target, Scale, ChevronRight, AlertTriangle } from "lucide-react";
import PlayerAvatar from "../components/PlayerAvatar";
import { cn } from "../lib/utils";

export default function ResultPhaseScreen({
  eliminatedPlayer,
  tie,
  votes,
  room,
  myPlayerId,
  onContinue,
}) {
  const me = room.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost;

  return (
    <div className="min-h-screen p-6 bg-black relative flex items-center justify-center overflow-hidden">
      {/* Background radial glow */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-colors duration-1000",
        tie ? "bg-zinc-900/20" : eliminatedPlayer?.isImposter ? "bg-cyan-900/10" : "bg-rose-900/10"
      )} />

      <div className="w-full max-w-4xl relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-zinc-500 font-orbitron text-[10px] tracking-[0.4em] uppercase">Post-Operation Debrief</div>
          <h1 className="text-5xl font-black font-orbitron text-white">MISSION <span className="text-zinc-400">REPORT</span></h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Result Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SpyDossier
              title="EXECUTION RESULTS"
              className={cn(
                "transition-all duration-500",
                tie ? "border-zinc-800" : eliminatedPlayer?.isImposter ? "border-cyan-500/30" : "border-rose-500/30"
              )}
            >
              <div className="py-6 text-center space-y-6">
                {tie ? (
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500">
                      <Scale size={40} />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black font-orbitron text-white uppercase tracking-wider">DEADLOCK</h2>
                      <p className="text-xs text-zinc-500 font-medium uppercase">Zero consensus reached. No agents eliminated.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative group">
                      <PlayerAvatar player={eliminatedPlayer} size="lg" className="border-none" />
                      <div className="absolute -top-2 -right-2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[8px] font-bold text-white font-orbitron uppercase z-50">TERMINATED</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest">Subject Identity</div>
                      <h2 className="text-3xl font-black font-orbitron text-white uppercase tracking-tighter">{eliminatedPlayer.name}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <div className="text-[8px] font-orbitron text-zinc-500 uppercase mb-1">Assigned Signal</div>
                        <div className="text-lg font-bold text-white uppercase tracking-wider">{eliminatedPlayer.word}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <div className="text-[8px] font-orbitron text-zinc-500 uppercase mb-1">Alignment</div>
                        <div className={cn(
                          "text-lg font-bold uppercase tracking-wider",
                          eliminatedPlayer.isImposter ? "text-cyan-400" : "text-rose-500"
                        )}>
                          {eliminatedPlayer.isImposter ? "MOLE" : "LOYAL"}
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      "p-4 rounded-xl flex gap-3 text-left items-start",
                      eliminatedPlayer.isImposter ? "bg-cyan-500/5 border border-cyan-500/10" : "bg-rose-500/5 border border-rose-500/10"
                    )}>
                      <AlertTriangle size={16} className={eliminatedPlayer.isImposter ? "text-cyan-500" : "text-rose-500"} />
                      <p className="text-[10px] uppercase font-medium leading-relaxed text-zinc-400">
                        {eliminatedPlayer.isImposter
                          ? "Protocol successful. A major leak in our network has been effectively plugged."
                          : "Catastrophic error. A sanctioned agent has been compromised due to operational misjudgment."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SpyDossier>
          </motion.div>

          {/* Sidebar: Vote Breakdown & Control */}
          <div className="space-y-6">
            <SpyDossier title="SIGNAL ANALYSIS">
              <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {votes && Object.entries(votes).sort(([, a], [, b]) => b - a).map(([playerId, count]) => {
                  const player = room.players.find(p => p.id === playerId);
                  return (
                    <div key={playerId} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 group hover:border-zinc-700 transition-all">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar player={player} size="sm" className="shrink-0" />
                        <span className="text-[10px] font-orbitron font-bold text-zinc-300 uppercase truncate max-w-[100px]">{player?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500"
                            style={{ width: `${(count / room.players.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold font-orbitron text-rose-500">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SpyDossier>

            <div className="pt-4">
              {isHost ? (
                <button
                  onClick={onContinue}
                  className="w-full group relative py-4 px-8 rounded-2xl bg-white text-black font-orbitron text-xs font-bold uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-rose-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  Continue Operations
                  <ChevronRight size={18} />
                </button>
              ) : (
                <div className="text-center p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 h-1 rounded-full bg-zinc-700 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                  <div className="text-[10px] font-orbitron text-zinc-600 uppercase tracking-widest">Awaiting Handler Authorization</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
