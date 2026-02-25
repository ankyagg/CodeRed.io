"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpyDossier } from "../components/ui/SpyDossier";
import { Shield, Send, Terminal, MessageSquare, History } from "lucide-react";
import PlayerAvatar from "../components/PlayerAvatar";
import { cn } from "../lib/utils";

export default function CluePhaseScreen({
  room,
  myPlayerId,
  currentTurnPlayerId,
  currentTurnPlayerName,
  clues,
  onSubmitClue,
}) {
  const [clue, setClue] = useState("");
  const isMyTurn = currentTurnPlayerId === myPlayerId;
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [clues]);

  const handleSubmit = () => {
    if (!clue.trim()) return;
    onSubmitClue(clue.trim());
    setClue("");
  };

  return (
    <div className="min-h-screen p-6 bg-black relative flex items-center justify-center overflow-hidden">
      {/* Background static/noise effect */}
      <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />

      <div className="w-full max-w-6xl grid md:grid-cols-4 gap-4 md:gap-8 relative z-10 max-h-[90vh] h-full items-start">

        {/* Left Sidebar: Agents Status */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="px-1 space-y-1">
            <h2 className="text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Shield size={12} className="text-rose-500" />
              Field Agents
            </h2>
            <div className="text-[10px] text-zinc-700 font-medium">PROTOCOL_ACTIVE</div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {room.players.filter(p => p.id !== myPlayerId).map((player, idx) => (
              <div
                key={player.id}
                className={cn(
                  "p-3 rounded-xl border flex items-center gap-3 transition-all duration-300",
                  player.id === currentTurnPlayerId
                    ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    : player.isAlive ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-900/20 border-zinc-900 opacity-40"
                )}
              >
                <PlayerAvatar player={player} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-orbitron text-white truncate uppercase tracking-wider">{player.name}</div>
                  <div className="text-[8px] text-zinc-500 uppercase">
                    {!player.isAlive ? "TERMINATED" : player.id === currentTurnPlayerId ? "TRANSMITTING..." : "MONITORING"}
                  </div>
                </div>
                {player.id === currentTurnPlayerId && (
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center gap-4">
            <PlayerAvatar player={room.players.find(p => p.id === myPlayerId)} size="sm" />
            <div className="flex-1">
              <div className="text-[8px] font-orbitron text-cyan-500/70 uppercase tracking-widest mb-1">Your ID</div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                {room.players.find(p => p.id === myPlayerId)?.name} (ACTIVE)
              </div>
            </div>
          </div>
        </div>

        {/* Center: Communication Terminal */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <SpyDossier title={`OPERATION LOG // ROUND ${room.round}`} className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest mb-4">
                <History size={12} />
                Signal History
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar"
              >
                {clues.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-3 grayscale">
                    <Terminal size={48} className="opacity-20 translate-y-2" />
                    <span className="text-[10px] font-orbitron uppercase tracking-widest">Awaiting first signal...</span>
                  </div>
                ) : (
                  clues.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4"
                    >
                      <div className="text-[10px] font-orbitron text-cyan-500/50 mt-1 whitespace-nowrap">
                        [{i.toString().padStart(2, '0')}]
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">{item.playerName}</span>
                          <span className="text-[8px] text-zinc-700 font-orbitron">R{item.round}</span>
                        </div>
                        <div className="text-lg font-bold text-white uppercase tracking-tighter">
                          {item.clue}
                        </div>
                        <div className="w-full h-[1px] bg-gradient-to-r from-zinc-800 to-transparent mt-2" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </SpyDossier>

          {/* Input Area */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-rose-500 rounded-2xl opacity-10 group-focus-within:opacity-20 blur transition-all" />
            <div className="relative glass-dark rounded-2xl p-4 flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isMyTurn ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-800 text-zinc-600"
              )}>
                <MessageSquare size={20} />
              </div>
              <input
                type="text"
                disabled={!isMyTurn}
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                placeholder={isMyTurn ? "TRANSMIT ONE-WORD SIGNAL..." : `AWAITING ${currentTurnPlayerName.toUpperCase()}...`}
                className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder:text-zinc-700 font-orbitron uppercase tracking-widest text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                disabled={!isMyTurn || !clue.trim()}
                onClick={handleSubmit}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  isMyTurn && clue.trim()
                    ? "bg-cyan-500 text-black hover:scale-105 active:scale-95"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                )}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Intel Analysis */}
        <div className="md:col-span-1 space-y-6">
          <SpyDossier title="TURN CONTROL">
            <div className="text-center py-4 space-y-4">
              <div className="relative inline-block">
                <PlayerAvatar
                  player={room.players.find(p => p.id === currentTurnPlayerId)}
                  size="xl"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest">Channel Master</div>
                <div className="text-sm font-bold text-white uppercase tracking-wider">{currentTurnPlayerName}</div>
                <div className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border inline-block",
                  isMyTurn ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                )}>
                  {isMyTurn ? "V-MASTER_AUTH" : "INBOUND_SIGNAL"}
                </div>
              </div>
            </div>
          </SpyDossier>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/5 to-transparent border border-rose-500/10">
            <div className="flex items-center gap-2 text-[10px] font-orbitron text-rose-400 uppercase tracking-widest mb-3">
              <Shield size={12} />
              Interrogation Rule
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase">
              Signals must be limited to exactly one word. Ambiguity is your tactical advantage or your downfall.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
