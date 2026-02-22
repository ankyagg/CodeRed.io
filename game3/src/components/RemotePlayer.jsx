import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerModel } from './PlayerModel.jsx';

/**
 * RemotePlayer — renders another connected player as a 3D avatar.
 * Smoothly interpolates position from server snapshots.
 * Shows a SpotLight torch when that player's torchOn flag is true.
 */
export const RemotePlayer = React.memo(({ playerData }) => {
    const groupRef = useRef();
    const targetPos = useRef(new THREE.Vector3(...(playerData.position ?? [0, 1.6, 0])));
    const currentPos = useRef(new THREE.Vector3(...(playerData.position ?? [0, 1.6, 0])));
    const spotRef = useRef();
    const [animation, setAnimation] = useState('Idle');
    const animRef = useRef('Idle');

    // Derive a stable hue from the player's socket ID for a unique colour (if we still need it for anything)
    const bodyHue = useMemo(() => {
        let hash = 0;
        for (const ch of playerData.id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
        return Math.abs(hash) % 360;
    }, [playerData.id]);

    const bodyColor = `hsl(${bodyHue}, 70%, 55%)`;

    // Sync target when server sends new position
    useEffect(() => {
        if (playerData.position) {
            targetPos.current.set(...playerData.position);
        }
    }, [playerData.position]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        // Exponential smoothing — feels responsive without jitter
        const t = 1 - Math.pow(0.001, delta);
        const oldPos = currentPos.current.clone();
        currentPos.current.lerp(targetPos.current, t);

        // Calculate speed for animation
        const distMoved = oldPos.distanceTo(currentPos.current);
        const speed = distMoved / delta;

        let nextAnim = 'Idle';
        if (speed > 0.1) {
            nextAnim = speed > 8 ? 'Run' : 'Walk';
        }

        if (animRef.current !== nextAnim) {
            animRef.current = nextAnim;
            setAnimation(nextAnim);
        }

        // Server position is camera/head height; place group so feet are at y=0
        groupRef.current.position.set(
            currentPos.current.x,
            0,  // feet on the floor
            currentPos.current.z
        );

        // Rotate body to face the direction the remote player is actually moving/facing
        if (playerData.modelRotation !== undefined) {
            groupRef.current.rotation.y = playerData.modelRotation;
        } else if (playerData.rotation) {
            groupRef.current.rotation.y = playerData.rotation[1];
        }

        // Position SpotLight at head level for torch
        if (spotRef.current) {
            // Set intensity based on torchOn status to avoid mounting/unmounting overhead
            spotRef.current.intensity = playerData.torchOn ? 50 : 0;

            if (playerData.torchOn) {
                // Torch hangs at head height, pointed forward
                const dir = new THREE.Vector3(0, 0, -1);
                if (playerData.rotation) {
                    dir.applyEuler(new THREE.Euler(0, playerData.rotation[1], 0, 'YXZ'));
                }
                const target = spotRef.current.target;
                target.position.set(dir.x * 10, 1.6 + dir.y * 2, dir.z * 10);
                target.updateMatrixWorld();
            }
        }
    });

    return (
        <group ref={groupRef}>
            {/* The Avatar Model */}
            <PlayerModel
                animation={animation}
                scale={0.6}
                position={[0, 0, 0]}
            />

            {/* Name tag glow */}
            <pointLight
                position={[0, 2.2, 0]}
                color={bodyColor}
                intensity={0.8}
                distance={2}
                decay={2}
            />

            {/* Health Bar of Team Mate */}
            <Billboard position={[0, 2.3, 0]}>
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[1.0, 0.12]} />
                    <meshBasicMaterial color="#000" />
                </mesh>
                <mesh position={[((playerData.health / 100) - 1) * 0.5, 0, 0.01]}>
                    <planeGeometry args={[Math.max(0.01, playerData.health / 100), 0.08]} />
                    <meshBasicMaterial color={playerData.health > 50 ? '#22dd55' : playerData.health > 25 ? '#ffaa00' : '#ff3322'} />
                </mesh>
            </Billboard>

            {/* Torch SpotLight (visible to all other clients) */}
            <spotLight
                ref={spotRef}
                position={[0, 1.6, 0.15]}
                color="#ffe8c0"
                intensity={0}
                angle={Math.PI / 7}
                penumbra={0.4}
                distance={20}
                decay={2}
                castShadow={false}
            />
        </group>
    );
});
