"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundBeams } from "../components/ui/BackgroundBeams";
import { TextGenerateEffect } from "../components/ui/TextGenerateEffect";
import { SpyDossier } from "../components/ui/SpyDossier";
import { TypewriterEffectSmooth } from "../components/ui/TypewriterEffect";
import { Shield, Users, Terminal, RefreshCw, ChevronLeft, ArrowRight, Activity, User } from "lucide-react";
import { cn } from "../lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
};

export default function HomeScreen({
  onCreateRoom,
  onJoinRoom,
  availableRooms,
  onRefreshRooms,
}) {
  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const titleWords = [
    { text: "UNDER", className: "text-white" },
    { text: "COVER", className: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-rose-500 text-glow" },
  ];

  useEffect(() => {
    if (mode === "join") {
      const interval = setInterval(() => {
        onRefreshRooms();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [mode, onRefreshRooms]);

  const handleCreateRoom = () => {
    if (!playerName.trim() || !roomName.trim()) return;
    onCreateRoom(playerName.trim(), roomName.trim(), selectedAvatar);
  };

  const handleJoinRoom = (roomId) => {
    if (!playerName.trim()) return;
    onJoinRoom(roomId, playerName.trim(), selectedAvatar);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-black selection:bg-cyan-500/30">
      <BackgroundBeams />

      <div className="fixed inset-4 md:inset-8 border border-white/5 pointer-events-none z-0 rounded-[2rem]">
        <div className="absolute top-0 left-10 right-10 flex justify-between">
          <div className="h-8 w-[1px] bg-gradient-to-b from-cyan-500/40 to-transparent" />
          <div className="px-4 py-1 bg-black border-x border-b border-white/10 text-[7px] font-orbitron text-zinc-600 tracking-[0.5em] uppercase">
            SECURE_COMMS_V4
          </div>
          <div className="h-8 w-[1px] bg-gradient-to-b from-rose-500/40 to-transparent" />
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-6xl grid md:grid-cols-5 gap-12 lg:gap-20 items-center relative z-10 px-4"
      >

        {/* Left Side: Branding */}
        <div className="md:col-span-3 space-y-8">
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-3 text-cyan-400 font-orbitron text-[9px] tracking-[0.5em] uppercase">
              <Activity size={14} className="animate-pulse" />
              <span className="bg-cyan-500/10 px-2 py-0.5 rounded">Signal Strength: Optimal</span>
            </div>

            <div className="relative">
              <TypewriterEffectSmooth
                words={titleWords}
                className="my-0"
                cursorClassName="h-8 sm:h-12 lg:h-20 bg-cyan-500"
              />
              <div className="absolute -left-4 sm:-left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-white to-rose-500 rounded-full opacity-50" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="max-w-xl">
            <TextGenerateEffect
              words="Identify the mole. Protect the intel. Trust no one in the world of high-stakes espionage."
              className="text-zinc-400 text-lg md:text-2xl font-medium leading-relaxed"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-8 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-600 font-orbitron uppercase tracking-widest">Operation Mode</span>
              <span className="text-xs font-bold text-zinc-300 tracking-widest">TACTICAL_DECEPTION</span>
            </div>
            <div className="hidden sm:block w-[1px] h-10 bg-zinc-800" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-600 font-orbitron uppercase tracking-widest">Deployment</span>
              <span className="text-xs font-bold text-zinc-300 tracking-widest">3-10 AGENTS</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Action Portal */}
        <div className="md:col-span-2 relative">
          <AnimatePresence mode="wait">
            {!mode ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-4"
              >
                <SpyDossier title="AUTHENTICATION_PORTAL" className="w-full">
                  <div className="space-y-4 pt-4">
                    <button
                      onClick={() => setMode("create")}
                      className="w-full group relative flex items-center justify-between p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all duration-500"
                    >
                      <div className="flex items-center gap-5">
                        <div className="p-3.5 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform duration-500">
                          <Terminal size={26} />
                        </div>
                        <div className="text-left">
                          <div className="font-orbitron text-sm font-black text-cyan-400 uppercase tracking-[0.2em]">Launch OPS</div>
                          <div className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Found new secure room</div>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-cyan-500 translate-x-[-10px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                    </button>

                    <button
                      onClick={() => {
                        setMode("join");
                        onRefreshRooms();
                      }}
                      className="w-full group relative flex items-center justify-between p-6 rounded-2xl bg-zinc-900 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-500"
                    >
                      <div className="flex items-center gap-5">
                        <div className="p-3.5 rounded-xl bg-zinc-800 text-zinc-500 group-hover:text-white transition-colors duration-500">
                          <Users size={26} />
                        </div>
                        <div className="text-left">
                          <div className="font-orbitron text-sm font-black text-zinc-300 uppercase tracking-[0.2em]">Infiltrate</div>
                          <div className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Intercept active signal</div>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-zinc-500 translate-x-[-10px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                    </button>
                  </div>
                </SpyDossier>
              </motion.div>
            ) : mode === "create" ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="space-y-4"
              >
                <SpyDossier title="PARAM_INITIALIZATION">
                  <div className="space-y-6 pt-2">
                    {/* Avatar Selector */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-orbitron uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                        <User size={12} />
                        Select Agent Avatar
                      </label>
                      <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {[...Array(15)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedAvatar(i)}
                            className={cn(
                              "aspect-square rounded-lg border-2 transition-all overflow-hidden relative group/avatar",
                              selectedAvatar === i
                                ? "border-cyan-500 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                            )}
                          >
                            <div
                              className="absolute inset-0 bg-no-repeat transition-transform duration-500 scale-[1.1] group-hover/avatar:scale-[1.2] pointer-events-none z-10"
                              style={{
                                backgroundImage: `url('/undercover/avatars.png?v=2')`,
                                backgroundSize: '500% 300%',
                                backgroundPosition: `${(i % 5) * 25}% ${Math.floor(i / 5) * 50}%`,
                                imageRendering: 'pixelated',
                              }}
                            />
                            {selectedAvatar === i && (
                              <div className="absolute inset-0 bg-cyan-500/10 flex items-center justify-center">
                                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-orbitron uppercase tracking-[0.3em] text-zinc-500">
                        Identity Designation
                      </label>
                      <input
                        type="text"
                        value={playerName}
                        autoFocus
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="ENTER CODENAME..."
                        className="w-full bg-black border border-white/5 rounded-xl p-4 text-white font-orbitron tracking-widest placeholder:text-zinc-900 focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all"
                        maxLength={20}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-orbitron uppercase tracking-[0.3em] text-zinc-500">
                        Mission Objective
                      </label>
                      <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="ROOM NAME..."
                        className="w-full bg-black border border-white/5 rounded-xl p-4 text-white font-orbitron tracking-widest placeholder:text-zinc-900 focus:outline-none focus:border-rose-500/50 focus:bg-rose-500/5 transition-all"
                        maxLength={30}
                      />
                    </div>

                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={() => setMode(null)}
                        className="flex-1 py-4 px-4 rounded-xl bg-zinc-900 text-zinc-500 font-orbitron text-[10px] uppercase tracking-widest hover:text-white transition-all"
                      >
                        Return
                      </button>
                      <button
                        onClick={handleCreateRoom}
                        disabled={!playerName.trim() || !roomName.trim()}
                        className="flex-[2] py-4 px-8 rounded-xl bg-cyan-600/20 text-cyan-400 font-orbitron text-[10px] font-black uppercase tracking-[0.3em] border border-cyan-500/50 hover:bg-cyan-600/30 disabled:opacity-30 transition-all font-bold"
                      >
                        Launch
                      </button>
                    </div>
                  </div>
                </SpyDossier>
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="space-y-4"
              >
                <div className="space-y-4">
                  {/* Join Name & Avatar Input */}
                  <SpyDossier title="AGENT_RECOGNITION">
                    <div className="space-y-4 py-2">
                      {/* Avatar Selector */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-orbitron uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                          <User size={12} />
                          Select Agent Avatar
                        </label>
                        <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                          {[...Array(15)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedAvatar(i)}
                              className={cn(
                                "aspect-square rounded-lg border-2 transition-all overflow-hidden relative",
                                selectedAvatar === i
                                  ? "border-cyan-500 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                              )}
                            >
                              <div
                                className="absolute inset-0 bg-no-repeat transition-transform duration-500 scale-[1.1] group-hover:scale-[1.2] pointer-events-none z-10"
                                style={{
                                  backgroundImage: `url('/undercover/avatars.png?v=2')`,
                                  backgroundSize: '500% 300%',
                                  backgroundPosition: `${(i % 5) * 25}% ${Math.floor(i / 5) * 50}%`,
                                  imageRendering: 'pixelated',
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-orbitron uppercase tracking-[0.3em] text-zinc-600">
                          Identity Verification
                        </label>
                        <input
                          type="text"
                          value={playerName}
                          autoFocus
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="YOUR CODENAME..."
                          className="w-full bg-zinc-950 border border-white/5 rounded-xl p-4 text-white font-orbitron tracking-widest placeholder:text-zinc-900 focus:outline-none focus:border-cyan-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </SpyDossier>

                  <SpyDossier title="SIGNAL_INTERCEPT" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] text-zinc-600 font-orbitron uppercase">{availableRooms.length} detected</span>
                      <button onClick={onRefreshRooms} className="text-zinc-700 hover:text-cyan-400 transition-colors">
                        <RefreshCw size={14} className={availableRooms.length === 0 ? "animate-spin-slow" : ""} />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {availableRooms.length === 0 ? (
                        <div className="py-12 text-center bg-black/40 rounded-2xl border border-white/5">
                          <Terminal size={32} className="mx-auto text-zinc-900 mb-3" />
                          <p className="text-zinc-700 text-[10px] font-orbitron uppercase tracking-widest">Scanning network...</p>
                        </div>
                      ) : (
                        availableRooms.map((room) => (
                          <div
                            key={room.roomId}
                            className="bg-black/40 p-4 rounded-xl border border-white/5 hover:border-cyan-500/40 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="font-orbitron text-xs font-black text-white uppercase tracking-widest">
                                  {room.roomName}
                                </div>
                                <div className="text-[9px] text-zinc-600 font-bold uppercase">
                                  {room.playerCount} Agents &bull; Host: {room.hostName.toUpperCase()}
                                </div>
                              </div>
                              <button
                                onClick={() => handleJoinRoom(room.roomId)}
                                disabled={!playerName.trim()}
                                className="px-5 py-2.5 rounded-lg bg-cyan-500 text-black font-orbitron text-[9px] font-black uppercase tracking-widest hover:scale-105 disabled:opacity-40 transition-all"
                              >
                                Join
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => setMode(null)}
                      className="w-full mt-4 py-3 px-4 rounded-xl bg-zinc-950 text-zinc-700 font-orbitron text-[10px] uppercase tracking-widest hover:text-white transition-all border border-white/5"
                    >
                      Return
                    </button>
                  </SpyDossier>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
