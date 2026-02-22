import React, { useState, useEffect } from 'react';

/**
 * VoiceChat UI Component — Backrooms themed
 * Matches Dark Room game aesthetic
 */
export function VoiceChat({ 
    isVoiceActive, 
    isMuted, 
    peerCount, 
    error, 
    onJoin, 
    onLeave, 
    onToggleMute 
}) {
    const [pulse, setPulse] = useState(false);

    // Pulse animation when speaking (not muted and active)
    useEffect(() => {
        if (isVoiceActive && !isMuted) {
            const interval = setInterval(() => setPulse(p => !p), 500);
            return () => clearInterval(interval);
        }
        setPulse(false);
    }, [isVoiceActive, isMuted]);

    const styles = {
        container: {
            position: 'fixed',
            top: 20,
            right: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 10,
            zIndex: 150,
            fontFamily: "'Outfit', 'Segoe UI', sans-serif",
            pointerEvents: 'auto',
        },
        panel: {
            background: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            backdropFilter: 'blur(12px)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        },
        joinBtn: {
            background: 'linear-gradient(180deg, rgba(80, 200, 120, 0.2) 0%, rgba(40, 100, 60, 0.3) 100%)',
            border: '1px solid rgba(100, 255, 150, 0.4)',
            borderRadius: 6,
            padding: '10px 18px',
            cursor: 'pointer',
            color: '#6eff6e',
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            boxShadow: '0 0 15px rgba(100, 255, 110, 0.2)',
        },
        muteBtn: {
            background: isMuted 
                ? 'linear-gradient(180deg, rgba(255, 80, 80, 0.2) 0%, rgba(150, 40, 40, 0.3) 100%)'
                : 'linear-gradient(180deg, rgba(80, 200, 120, 0.15) 0%, rgba(40, 100, 60, 0.2) 100%)',
            border: `1px solid ${isMuted ? 'rgba(255, 100, 100, 0.5)' : 'rgba(100, 255, 150, 0.3)'}`,
            borderRadius: 6,
            padding: '8px 14px',
            cursor: 'pointer',
            color: isMuted ? '#ff6e6e' : '#6eff6e',
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
        },
        leaveBtn: {
            background: 'linear-gradient(180deg, rgba(255, 60, 60, 0.2) 0%, rgba(150, 30, 30, 0.3) 100%)',
            border: '1px solid rgba(255, 80, 80, 0.4)',
            borderRadius: 6,
            padding: '8px 12px',
            cursor: 'pointer',
            color: '#ff6e6e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
        },
        statusDot: {
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isVoiceActive 
                ? (isMuted ? '#ff6e6e' : '#6eff6e') 
                : '#666',
            boxShadow: isVoiceActive 
                ? (isMuted 
                    ? '0 0 8px #ff6e6e' 
                    : `0 0 ${pulse ? 12 : 6}px #6eff6e`)
                : 'none',
            transition: 'box-shadow 0.3s ease',
        },
        label: {
            fontSize: 10,
            color: '#888',
            letterSpacing: 2,
            textTransform: 'uppercase',
        },
        count: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#4af',
            letterSpacing: 2,
        },
        errorBox: {
            background: 'rgba(255, 60, 60, 0.15)',
            border: '1px solid rgba(255, 80, 80, 0.4)',
            borderRadius: 6,
            padding: '8px 12px',
            color: '#ff6e6e',
            fontSize: 11,
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
        },
        voiceWaves: {
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            marginLeft: 4,
        },
        wave: (i, active) => ({
            width: 3,
            height: active ? [8, 14, 10, 16, 8][i] : 4,
            background: active ? '#6eff6e' : '#444',
            borderRadius: 2,
            transition: 'height 0.15s ease',
            animation: active ? `wave ${0.4 + i * 0.1}s ease-in-out infinite alternate` : 'none',
        }),
    };

    // Not in voice chat - show join button
    if (!isVoiceActive) {
        return (
            <div style={styles.container}>
                {error && (
                    <div style={styles.errorBox}>
                        <span>⚠</span> {error}
                    </div>
                )}
                <button 
                    style={styles.joinBtn} 
                    onClick={onJoin}
                    onMouseEnter={(e) => {
                        e.target.style.boxShadow = '0 0 25px rgba(100, 255, 110, 0.4)';
                        e.target.style.borderColor = 'rgba(100, 255, 150, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.boxShadow = '0 0 15px rgba(100, 255, 110, 0.2)';
                        e.target.style.borderColor = 'rgba(100, 255, 150, 0.4)';
                    }}
                >
                    <MicIcon size={14} /> VOICE CHAT
                </button>
            </div>
        );
    }

    // In voice chat - show controls
    return (
        <div style={styles.container}>
            <style>{`
                @keyframes wave {
                    0% { transform: scaleY(0.5); }
                    100% { transform: scaleY(1); }
                }
            `}</style>
            
            {error && (
                <div style={styles.errorBox}>
                    <span>⚠</span> {error}
                </div>
            )}
            
            <div style={styles.panel}>
                {/* Status indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={styles.label}>VOICE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={styles.statusDot} />
                        <span style={styles.count}>{peerCount + 1}</span>
                    </div>
                </div>

                {/* Voice waves visualization */}
                <div style={styles.voiceWaves}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} style={styles.wave(i, isVoiceActive && !isMuted)} />
                    ))}
                </div>

                {/* Mute button */}
                <button 
                    style={styles.muteBtn} 
                    onClick={onToggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicOffIcon size={14} /> : <MicIcon size={14} />}
                    {isMuted ? 'MUTED' : 'LIVE'}
                </button>

                {/* Leave button */}
                <button 
                    style={styles.leaveBtn} 
                    onClick={onLeave}
                    title="Leave voice chat"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 80, 80, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <PhoneOffIcon size={16} />
                </button>
            </div>
        </div>
    );
}

// SVG Icons matching the theme
function MicIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
    );
}

function MicOffIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
    );
}

function PhoneOffIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
            <line x1="23" y1="1" x2="1" y2="23"/>
        </svg>
    );
}

export default VoiceChat;
