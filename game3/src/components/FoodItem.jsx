import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_PATH = './models/rice.glb';

/**
 * FoodItem — Renders the rice GLB model at the given position.
 */
export const FoodItem = React.memo(({ food }) => {
    const { scene } = useGLTF(MODEL_PATH);

    const clonedScene = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    }, [scene]);

    const rotation = [0, (food.hue / 360) * Math.PI * 2, 0];

    return (
        <group
            position={food.position}
            rotation={rotation}
            scale={0.8}
            userData={{ isFoodItem: true, foodId: food.id }}
        >
            <primitive object={clonedScene} />
        </group>
    );
});

useGLTF.preload(MODEL_PATH);
