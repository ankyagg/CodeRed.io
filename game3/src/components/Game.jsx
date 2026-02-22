import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Environment } from './Environment.jsx';
import { LocalPlayer } from './LocalPlayer.jsx';
import { RemotePlayer } from './RemotePlayer.jsx';
import { Enemy } from './Enemy.jsx';
import { FoodItem } from './FoodItem.jsx';

function SceneContents({ socket, remotePlayers, foods, enemies, serverDayProgress, onBatteryChange, onHidingChange, inventory, setInventory }) {
    const ambientRef = useRef();
    const sunRef = useRef();
    const fogRef = useRef();
    useFrame(() => {
        const dp = serverDayProgress !== undefined ? serverDayProgress : 0;

        // Peak the sun only during the first 50% (Daytime)
        const sunFactor = dp < 0.5 ? Math.sin((dp / 0.5) * Math.PI) : 0;

        if (ambientRef.current) {
            // Day is much brighter now
            ambientRef.current.intensity = 0.3 + sunFactor * 1.5;
        }
        if (sunRef.current) {
            sunRef.current.intensity = sunFactor * 2.5;
        }
        if (fogRef.current) {
            fogRef.current.near = 10 + sunFactor * 25;
            fogRef.current.far = 50 + sunFactor * 100;
        }
    });

    return (
        <>
            <fog ref={fogRef} attach="fog" args={['#020208', 8, 45]} />
            <ambientLight ref={ambientRef} intensity={0.3} color="#ffffff" />
            <directionalLight ref={sunRef} position={[10, 20, 10]} intensity={0} color="#fffcf0" />

            <Environment dayProgress={serverDayProgress} />

            <LocalPlayer socket={socket} onBatteryChange={onBatteryChange} foods={foods} onHidingChange={onHidingChange} inventory={inventory} setInventory={setInventory} />

            {Object.values(remotePlayers).map((p) => (
                <RemotePlayer key={p.id} playerData={p} />
            ))}

            {enemies && Object.values(enemies).map((e) => (
                <Enemy key={e.id} enemyData={e} />
            ))}

            {foods && Object.values(foods).map((f) => (
                <FoodItem key={f.id} food={f} />
            ))}
        </>
    );
}

export const Game = React.memo(({ socket, remotePlayers, foods, enemies, dayProgress, onBatteryChange, onHidingChange, inventory, setInventory }) => {
    return (
        <Canvas
            style={{ position: 'absolute', top: 0, left: 0 }}
            camera={{ fov: 75, near: 0.1, far: 120, position: [0, 1.6, 28], rotation: [0, Math.PI, 0] }}
            gl={{ antialias: false, powerPreference: 'high-performance' }}
        >
            <Suspense fallback={
                <Html center>
                    <div style={{
                        color: '#4af',
                        background: 'rgba(0,0,0,0.8)',
                        padding: '20px 40px',
                        borderRadius: '8px',
                        border: '1px solid #4af',
                        fontFamily: "'Outfit', sans-serif",
                        textAlign: 'center',
                        minWidth: '300px'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '4px' }}>LOADING ASSETS</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Accessing Darkroom Archives...</div>
                        <div className="loading-spinner" style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(68,170,255,0.1)',
                            borderTop: '3px solid #4af',
                            borderRadius: '50%',
                            margin: '20px auto 0',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <style>{`
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        `}</style>
                    </div>
                </Html>
            }>
                <SceneContents
                    socket={socket}
                    remotePlayers={remotePlayers}
                    foods={foods}
                    enemies={enemies}
                    serverDayProgress={dayProgress}
                    onBatteryChange={onBatteryChange}
                    onHidingChange={onHidingChange}
                    inventory={inventory}
                    setInventory={setInventory}
                />
            </Suspense>
        </Canvas>
    );
});
