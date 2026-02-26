import React, { useEffect, useRef, useState } from 'react';

/**
 * HUD — DOM overlay rendered on top of the R3F canvas.
 * Includes health, inventory, damage flash, and controls.
 */
export function HUD({ health, battery, playerCount, connected, roomId, dayProgress = 0, isHiding, inventory = [], onUseItem }) {
    const healthColor = health > 50 ? '#22dd55' : health > 25 ? '#ffaa00' : '#ff3322';
    const isNight = dayProgress >= 0.5;
    const statusText = isNight ? '⚠️ NIGHT SHIFT: SURVIVE' : '☀️ DAYTIME: RESTOCK';
    const statusColor = isNight ? '#ff3e3e' : '#4a9eff';

    // Red damage flash
    const [damageFlash, setDamageFlash] = useState(false);
    const prevHealth = useRef(health);

    useEffect(() => {
        if (health < prevHealth.current) {
            setDamageFlash(true);
            const timer = setTimeout(() => setDamageFlash(false), 300);
            prevHealth.current = health;
            return () => clearTimeout(timer);
        }
        prevHealth.current = health;
    }, [health]);

    const panelBase = {
        background: 'rgba(0,0,0,0.65)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        backdropFilter: 'blur(10px)',
        pointerEvents: 'auto',
        padding: '10px 16px',
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 100,
            fontFamily: "'Outfit', sans-serif",
            userSelect: 'none',
        }}>

            {/* ── DAMAGE FLASH ────────────────────────── */}
            {damageFlash && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.5) 100%)',
                    pointerEvents: 'none',
                    zIndex: 200,
                    animation: 'fadeOut 0.3s ease-out forwards',
                }} />
            )}

            {/* ── Crosshair ─────────────────────────────────── */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '12px',
                height: '12px',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ width: 3, height: 3, background: '#fff', borderRadius: '50%', boxShadow: '0 0 2px #000' }} />
            </div>

            {/* ── Room Info (Top Left) ───────────────────────── */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                pointerEvents: 'auto'
            }}>
                <div style={panelBase}>
                    <div style={{ fontSize: 10, color: '#777', letterSpacing: 2 }}>ROOM</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4af', letterSpacing: 3 }}>{roomId}</div>
                </div>

                <div style={{
                    ...panelBase,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: connected ? '#ccc' : '#f55',
                }}>
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: connected ? '#f44' : '#555',
                        boxShadow: connected ? '0 0 8px #f44' : 'none',
                    }} />
                    {playerCount}P
                </div>

                <button
                    onClick={() => navigator.clipboard.writeText(roomId)}
                    style={{
                        ...panelBase,
                        cursor: 'pointer',
                        color: '#4af',
                        fontWeight: 'bold',
                        fontSize: 12,
                        letterSpacing: 1,
                    }}
                >SHARE</button>

                <button
                    onClick={() => window.location.reload()}
                    style={{
                        ...panelBase,
                        cursor: 'pointer',
                        color: '#f55',
                        fontWeight: 'bold',
                        fontSize: 12,
                        letterSpacing: 1,
                    }}
                >EXIT</button>
            </div>

            {/* ── Phase Counter (Below Room Info) ──────────────── */}
            <div style={{
                position: 'absolute',
                top: 85,
                left: 16,
                ...panelBase,
                minWidth: 120,
                textAlign: 'center',
                borderColor: statusColor + '44'
            }}>
                <div style={{ fontSize: 9, color: '#777', letterSpacing: 1, marginBottom: 2 }}>PHASE ENDS IN</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: statusColor, fontFamily: 'monospace' }}>
                    {(() => {
                        const totalSec = 80;
                        const nightThresh = 0.5;
                        let remaining = 0;
                        if (dayProgress < nightThresh) {
                            remaining = (nightThresh - dayProgress) * totalSec;
                        } else {
                            remaining = (1.0 - dayProgress) * totalSec;
                        }
                        return Math.ceil(remaining) + 's';
                    })()}
                </div>
            </div>

            {/* ── Day/Night Status ────────────────────────── */}
            <div style={{
                position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                ...panelBase, textAlign: 'center', fontSize: 14, fontWeight: 'bold',
                color: statusColor, letterSpacing: 1,
            }}>
                {statusText}
                <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.1)', marginTop: 6, borderRadius: 2 }}>
                    <div style={{
                        width: isNight
                            ? `${((dayProgress - 0.5) / 0.5) * 100}%`
                            : `${(dayProgress / 0.5) * 100}%`,
                        height: '100%',
                        background: statusColor,
                        transition: 'width 1s linear'
                    }} />
                </div>
            </div>

            {/* ── Stealth / Hiding Status ───────── */}
            {isHiding && (
                <div style={{
                    position: 'absolute',
                    bottom: 100,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#00ffa3',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textShadow: '0 0 10px #00ffa3',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '4px 12px',
                    borderRadius: 20
                }}>
                    👤 HIDDEN
                </div>
            )}

            {/* ── Stats panel ──────────────────────── */}
            <div style={{ position: 'absolute', bottom: 28, left: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <StatBar icon="❤️" label="HEALTH" value={health} max={100} barColor={healthColor} panelBase={panelBase} />
            </div>

            {/* ── Inventory (Bottom Center) ────────── */}
            <div style={{
                position: 'absolute',
                bottom: 28,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
            }}>
                <div style={{ fontSize: 10, color: '#666', letterSpacing: 2, marginBottom: 2 }}>INVENTORY</div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {[0, 1, 2, 3, 4].map(slot => {
                        const item = inventory[slot];
                        return (
                            <div
                                key={slot}
                                onClick={() => item && onUseItem && onUseItem(slot)}
                                title={item ? 'Click to eat (+10 HP)' : `Slot ${slot + 1} — empty`}
                                style={{
                                    ...panelBase,
                                    width: 50,
                                    height: 50,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: item ? 24 : 16,
                                    color: item ? '#fff' : '#333',
                                    cursor: item ? 'pointer' : 'default',
                                    border: item ? '1px solid rgba(100,255,100,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    transition: 'transform 0.1s',
                                }}
                                onMouseEnter={e => { if (item) e.currentTarget.style.transform = 'scale(1.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                {item ? '🍚' : (slot + 1)}
                                {item && (
                                    <div style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        fontSize: 8,
                                        color: '#4f4',
                                        background: 'rgba(0,0,0,0.8)',
                                        borderRadius: 3,
                                        padding: '1px 3px',
                                    }}>+10</div>
                                )}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 2,
                                    right: 4,
                                    fontSize: 9,
                                    color: '#666',
                                }}>{slot + 1}</div>
                            </div>
                        );
                    })}
                </div>
                {inventory.length > 0 && (
                    <div style={{ fontSize: 9, color: '#555' }}>Press 1-5 or click to eat</div>
                )}
            </div>

            {/* ── Controls hint ───────────────────── */}
            <div style={{ position: 'absolute', bottom: 28, right: 20, ...panelBase, color: '#aaa', fontSize: 11, textAlign: 'right' }}>
                <div>W A S D — Move | Shift — Sprint</div>
                <div>C — Crouch/Stealth | F — Torch</div>
                <div>E — Pick Up Food | 1-5 — Use Item</div>
                <div>V — Toggle FPP/TPP</div>
            </div>

            {/* ── Death Screen ──────────────────────── */}
            {
                health <= 0 && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(100, 0, 0, 0.85)', backdropFilter: 'blur(15px)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        color: '#fff', zIndex: 1000, pointerEvents: 'auto'
                    }}>
                        <h1 style={{ fontSize: '72px', margin: 0, fontWeight: 900, textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>YOU WERE CAUGHT</h1>
                        <p style={{ fontSize: '22px', opacity: 0.8, marginTop: 10 }}>The managers found you after hours...</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ ...panelBase, color: '#fff', marginTop: 30, cursor: 'pointer', padding: '15px 40px', fontSize: '18px' }}
                        >
                            RETRY SHIFT
                        </button>
                    </div>
                )
            }

            {/* Inline CSS for animation */}
            <style>{`
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>
        </div >
    );
}

function StatBar({ icon, label, value, max, barColor, panelBase }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
        <div style={{ ...panelBase, padding: '8px 14px', minWidth: 210 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, color: '#aaa' }}>
                <span>{icon} {label}</span>
                <span>{Math.round(value)}/{max}</span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.3s' }} />
            </div>
        </div>
    );
}
