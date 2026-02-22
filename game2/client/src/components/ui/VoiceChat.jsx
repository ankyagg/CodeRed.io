import React, { useState, useEffect } from 'react';

/**
 * VoiceChat UI Component — Escape Room themed
 * Sophisticated, vintage aesthetic (Gold, Wood, Glass)
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
            top: 90,
            right: 25,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 12,
            zIndex: 1000,
            fontFamily: "'Playfair Display', serif",
            pointerEvents: 'auto',
        },
        panel: {
            background: 'rgba(28, 22, 17, 0.85)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '2px',
            backdropFilter: 'blur(10px)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 15,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(212, 175, 55, 0.1)',
        },
        joinBtn: {
            background: 'rgba(58, 42, 24, 0.6)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            borderRadius: '2px',
            padding: '10px 20px',
            cursor: 'pointer',
            color: '#d4af37',
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: '0.15em',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
        },
        muteBtn: {
            background: isMuted
                ? 'rgba(120, 40, 40, 0.2)'
                : 'rgba(58, 42, 24, 0.3)',
            border: `1px solid ${isMuted ? 'rgba(255, 100, 100, 0.4)' : 'rgba(212, 175, 55, 0.25)'}`,
            borderRadius: '1px',
            padding: '8px 14px',
            cursor: 'pointer',
            color: isMuted ? '#ff9999' : '#d4af37',
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
        },
        leaveBtn: {
            background: 'transparent',
            border: '1px solid rgba(255, 100, 100, 0.3)',
            borderRadius: '1px',
            padding: '8px 10px',
            cursor: 'pointer',
            color: 'rgba(255, 100, 100, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
        },
        statusDot: {
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isVoiceActive
                ? (isMuted ? '#ff5555' : '#d4af37')
                : '#444',
            boxShadow: isVoiceActive
                ? (isMuted
                    ? '0 0 10px rgba(255, 85, 85, 0.6)'
                    : `0 0 ${pulse ? 15 : 8}px rgba(212, 175, 55, 0.8)`)
                : 'none',
            transition: 'all 0.4s ease',
        },
        label: {
            fontSize: 9,
            color: '#a08a70',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 2,
        },
        count: {
            fontSize: 16,
            fontWeight: 400,
            color: '#d4af37',
            fontFamily: "'Playfair Display', serif",
        },
        errorBox: {
            background: 'rgba(120, 40, 40, 0.2)',
            border: '1px solid rgba(255, 100, 100, 0.3)',
            borderRadius: '2px',
            padding: '8px 12px',
            color: '#ff9999',
            fontSize: 11,
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        },
        voiceWaves: {
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            margin: '0 8px',
        },
        wave: (i, active) => ({
            width: 2,
            height: active ? [6, 12, 8, 14, 6][i] : 3,
            background: active ? '#d4af37' : 'rgba(212, 175, 55, 0.2)',
            borderRadius: 1,
            transition: 'height 0.2s ease',
            animation: active ? `goldWave ${0.5 + i * 0.15}s ease-in-out infinite alternate` : 'none',
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
                        e.currentTarget.style.background = 'rgba(78, 52, 34, 0.7)';
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.7)';
                        e.currentTarget.style.boxShadow = '0 5px 25px rgba(212, 175, 55, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(58, 42, 24, 0.6)';
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
                    }}
                >
                    <MicIcon size={14} /> COMMUNICATE
                </button>
            </div>
        );
    }

    // In voice chat - show controls
    return (
        <div style={styles.container}>
            <style>{`
                @keyframes goldWave {
                    0% { transform: scaleY(0.4); opacity: 0.6; }
                    100% { transform: scaleY(1); opacity: 1; }
                }
            `}</style>

            {error && (
                <div style={styles.errorBox}>
                    <span>⚠</span> {error}
                </div>
            )}

            <div style={styles.panel}>
                {/* Status indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={styles.label}>ESTABLISHED</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    {isMuted ? 'SILENCED' : 'TRANSMITTING'}
                </button>

                {/* Leave button */}
                <button
                    style={styles.leaveBtn}
                    onClick={onLeave}
                    title="Terminate link"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 100, 100, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255, 100, 100, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255, 100, 100, 0.3)';
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
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    );
}

function MicOffIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    );
}

function PhoneOffIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
            <line x1="23" y1="1" x2="1" y2="23" />
        </svg>
    );
}

export default VoiceChat;
