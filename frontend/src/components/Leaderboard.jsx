export default function Leaderboard({ leaderboard, myId, isOpen }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-6 rounded-2xl w-[500px] shadow-2xl pointer-events-auto">
                <h2 className="text-2xl font-black text-white mb-6 text-center tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                    🏆 LEADERBOARD
                </h2>

                <div className="flex text-xs font-bold text-gray-400 pb-2 border-b border-white/10 mb-4 px-2">
                    <div className="w-12 text-center">RANK</div>
                    <div className="flex-1">PLAYER</div>
                    <div className="w-20 text-right">SCORE</div>
                    <div className="w-16 text-right">K/D</div>
                    <div className="w-16 text-right">TIME</div>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {leaderboard.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 italic">No survivors yet...</div>
                    ) : (
                        leaderboard.map((player, index) => {
                            const isMe = player.id === myId;
                            const isTop3 = index < 3;

                            let rankColors = "text-gray-400 font-mono";
                            if (index === 0) rankColors = "text-yellow-400 font-black text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]";
                            else if (index === 1) rankColors = "text-gray-300 font-black text-lg drop-shadow-[0_0_5px_rgba(209,213,219,0.5)]";
                            else if (index === 2) rankColors = "text-amber-600 font-black text-lg drop-shadow-[0_0_5px_rgba(217,119,6,0.5)]";

                            return (
                                <div
                                    key={player.id}
                                    className={`flex items-center text-sm p-3 rounded-lg transition-colors
                                        ${isMe ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}
                                    `}
                                >
                                    <div className={`w-12 text-center ${rankColors}`}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 truncate px-2 font-bold flex items-center gap-2">
                                        <span className={isMe ? 'text-white' : 'text-gray-300'}>{player.name}</span>
                                        {isMe && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                                    </div>
                                    <div className="w-20 text-right font-mono text-emerald-400 font-bold">
                                        {Math.max(0, player.score - 1000).toLocaleString()}
                                    </div>
                                    <div className="w-16 text-right font-mono text-gray-400">
                                        <span className="text-orange-400">{player.kills}</span>/<span className="text-red-400">{player.deaths}</span>
                                    </div>
                                    <div className="w-16 text-right font-mono text-gray-500 text-xs">
                                        {Math.floor(player.survivalTimeSec / 60)}m {player.survivalTimeSec % 60}s
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-6 text-center text-xs text-gray-500 font-mono">
                    Release [TAB] to close
                </div>
            </div>
        </div>
    );
}
