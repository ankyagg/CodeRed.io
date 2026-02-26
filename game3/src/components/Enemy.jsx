import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { clone as SkeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';

const MODEL_PATH = './models/Slow Run.glb';

export function Enemy({ enemyData }) {
    const groupRef = useRef();
    const modelRef = useRef();
    const { scene, animations } = useGLTF(MODEL_PATH);

    // Clone scene for independent skeleton
    const clonedScene = useMemo(() => {
        const clone = SkeletonClone(scene);
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Make it look creepy — darken the material
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(m => {
                            const newM = m.clone();
                            if (newM.color) newM.color.set('#1a3a5a');
                            return newM;
                        });
                    } else {
                        child.material = child.material.clone();
                        if (child.material.color) child.material.color.set('#1a3a5a');
                    }
                }
            }
        });
        return clone;
    }, [scene]);

    // Strip root motion from animations
    const clonedAnimations = useMemo(() => {
        return animations.map(clip => {
            const cloned = clip.clone();
            cloned.tracks = cloned.tracks.filter(track => !track.name.endsWith('.position'));
            return cloned;
        });
    }, [animations]);

    const { actions, names } = useAnimations(clonedAnimations, modelRef);

    // Play the run animation
    useEffect(() => {
        if (names.length > 0) {
            const action = actions[names[0]];
            if (action) {
                action.reset().play();
                action.setLoop(THREE.LoopRepeat);
                action.timeScale = 0.8; // Slow creepy run
            }
        }
    }, [names, actions]);

    const prevPos = useRef(new THREE.Vector3(enemyData.position[0], 0, enemyData.position[2]));

    useFrame(() => {
        if (groupRef.current && enemyData.position) {
            const target = new THREE.Vector3(enemyData.position[0], 0, enemyData.position[2]);
            groupRef.current.position.lerp(target, 0.1);

            // Face the movement direction
            const dir = target.clone().sub(prevPos.current);
            if (dir.lengthSq() > 0.0001) {
                const angle = Math.atan2(dir.x, dir.z);
                groupRef.current.rotation.y = angle;
            }
            prevPos.current.copy(groupRef.current.position);
        }
    });

    return (
        <group ref={groupRef} position={[enemyData.position[0], 0, enemyData.position[2]]}>
            <group ref={modelRef} scale={0.9}>
                <primitive object={clonedScene} />
            </group>
            {/* Glowing red eyes */}
            <mesh position={[-0.08, 1.65, 0.15]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
            </mesh>
            <mesh position={[0.08, 1.65, 0.15]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
            </mesh>
            {/* Eerie red glow */}
            <pointLight color="#ff2222" intensity={2} distance={5} decay={2} position={[0, 1.5, 0]} />
        </group>
    );
}

useGLTF.preload(MODEL_PATH);
