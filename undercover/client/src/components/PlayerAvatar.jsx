"use client";
import React from "react";
import { ShieldCheck, User } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * PlayerAvatar - Renders the JoJo Among Us avatar based on player's avatarIndex.
 * Uses standard CSS background-position for the most stable cross-browser rendering.
 */
export default function PlayerAvatar({
  player,
  showStatus = false,
  size = "md",
  className,
}) {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const avatarIndex = player?.avatarIndex ?? 0;
  const col = avatarIndex % 5;
  const row = Math.floor(avatarIndex / 5);

  // Standard percentage mapping for 5x3 grid:
  // x: 0%, 25%, 50%, 75%, 100% (5 cols)
  // y: 0%, 50%, 100% (3 rows)
  const posX = col * 25;
  const posY = row * 50;

  return (
    <div className={cn("flex flex-col items-center gap-2 group", className)}>
      <div className="relative">
        <div
          className={cn(
            sizes[size],
            "rounded-2xl flex items-center justify-center border-2 transition-all duration-500 overflow-hidden relative bg-zinc-900/50",
            !player?.isAlive
              ? "border-zinc-800 opacity-40 grayscale"
              : player?.isReady || player?.isHost
                ? "border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                : "border-zinc-800 hover:border-zinc-700"
          )}
        >
          {/* Fallback Icon */}
          <User className="text-zinc-800 absolute inset-0 m-auto" size={size === "sm" ? 16 : 32} />

          {/* Sprite Rendering - Using absolute centering + scale for balanced framing */}
          <div
            className="absolute inset-0 bg-no-repeat transition-transform duration-500 scale-[1.1] group-hover:scale-[1.2] z-10"
            style={{
              backgroundImage: `url('/undercover/avatars.png?v=2')`,
              backgroundSize: '500% 300%',
              backgroundPosition: `${posX}% ${posY}%`,
              imageRendering: 'pixelated',
            }}
          />

          <div className="absolute inset-0 bg-noise opacity-10 z-20 pointer-events-none" />

          {/* Active scanning bar for ready players */}
          {(player?.isReady || player?.isHost) && player?.isAlive && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent animate-scan-y z-30 pointer-events-none" />
          )}
        </div>

        {player?.isHost && (
          <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-md p-1 border border-black shadow-lg z-40">
            <ShieldCheck size={10} />
          </div>
        )}
      </div>

      <div className="text-center">
        {player?.name && (
          <div
            className={cn(
              "font-orbitron font-bold tracking-wider transition-colors",
              size === "sm" ? "text-[8px]" : "text-[10px]",
              !player.isAlive ? "text-zinc-700 line-through" : "text-zinc-300",
              (player.isReady || player.isHost) && "text-cyan-400"
            )}
          >
            {player.name.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
