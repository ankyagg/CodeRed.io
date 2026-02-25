"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpyDossier } from "../components/ui/SpyDossier";
import { ShieldAlert, Crosshair, Users, Loader2, CheckCircle } from "lucide-react";
import PlayerAvatar from "../components/PlayerAvatar";
import { cn } from "../lib/utils";

export default function VotingPhaseScreen({ room, myPlayerId, onSubmitVote }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const alivePlayers = room.players.filter(
    (p) => p.isAlive && p.id !== myPlayerId,
  );

  const handleVote = () => {
    if (!selectedPlayerId) return;
    onSubmitVote(selectedPlayerId);
    setHasVoted(true);
  };

  return (
    <div className="min-h-screen p-6 bg-black relative flex items-center justify-center overflow-hidden">
      {/* Red alert pulse background */}
      <div className="absolute inset-0 bg-rose-950/5 animate-pulse pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.8)] z-50 overflow-hidden">
        <div className="w-1/4 h-full bg-white opacity-40 animate-scan-x" />
      </div>

      <div className="w-full max-w-6xl relative z-10 grid md:grid-cols-4 gap-4 md:gap-8 max-h-[90vh] h-full items-start">

        {/* Left: Intelligence Summary */}
        <div className="md:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-500 font-orbitron text-[10px] tracking-[0.3em] uppercase">
              <ShieldAlert size={20} />
              Threat Detected
            </div>
            <h1 className="text-4xl font-black font-orbitron text-white leading-tight">
              NEUTRALIZE<br />
              <span className="text-rose-500 uppercase tracking-tighter">THE MOLE</span>
            </h1>

            <SpyDossier title="Mission Directive">
              <p className="text-[10px] text-zinc-400 leading-relaxed uppercase py-2">
                Analyze signal history. Cross-reference discrepancies. Select one agent for immediate termination. Error is not an option.
              </p>
            </SpyDossier>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="text-[8px] font-orbitron text-zinc-500 uppercase tracking-widest mb-1">Active Voters</div>
              <div className="text-xl font-bold text-white font-orbitron">
                {room.players.filter(p => p.isAlive).length} AGENTS
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center: Suspect Grid */}
        <div className="md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {!hasVoted ? (
              <motion.div
                key="voting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                  {alivePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className={cn(
                        "relative group p-4 rounded-2xl border transition-all duration-500 text-left overflow-hidden",
                        selectedPlayerId === player.id
                          ? "bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.2)] scale-[1.02]"
                          : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      {/* Scanning visual for selected suspect */}
                      {selectedPlayerId === player.id && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.1),transparent)]" />
                          <div className="absolute top-0 left-0 h-full w-[1px] bg-rose-500/50 animate-scan-x" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 relative z-10">
                        <PlayerAvatar player={player} size="sm" className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-orbitron text-xs font-bold text-white uppercase truncate tracking-widest group-hover:text-rose-400 transition-colors">
                            {player.name}
                          </div>
                          <div className="text-[8px] text-zinc-500 font-medium uppercase mt-0.5">
                            Suspect Rating: HIGH
                          </div>
                        </div>
                        {selectedPlayerId === player.id && <Crosshair size={18} className="text-rose-500 animate-pulse" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleVote}
                    disabled={!selectedPlayerId}
                    className={cn(
                      "group relative px-12 py-4 rounded-2xl font-orbitron text-sm font-bold uppercase tracking-[0.3em] transition-all",
                      selectedPlayerId
                        ? "bg-rose-600 text-white shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:scale-105 active:scale-95"
                        : "bg-zinc-900 text-zinc-700 border border-zinc-800 cursor-not-allowed"
                    )}
                  >
                    Confirm Neutralization
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="voted"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full space-y-6"
              >
                <div className="relative">
                  <div className="absolute -inset-8 bg-rose-500/20 blur-3xl rounded-full animate-pulse" />
                  <div className="w-24 h-24 rounded-full border-4 border-rose-500 flex items-center justify-center">
                    <CheckCircle size={48} className="text-rose-500" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black font-orbitron text-white uppercase tracking-widest">Signal Transmitted</h2>
                  <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-[0.2em]">Synchronization with other agents in progress...</p>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-rose-500/50 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
