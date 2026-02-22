import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerControls } from '../hooks/usePlayerControls.js';
import { PlayerModel } from './PlayerModel.jsx';
import { resolveCollisions } from '../utils/collisionBoxes.js';

const MOVE_SPEED = 4;
const SPRINT_SPEED = 8;
const CROUCH_SPEED = 3;
const PLAYER_HEIGHT = 1.6;
const CROUCH_HEIGHT = 0.8;
const ROOM_BOUND = 34;
const TRANSFORM_HZ = 15;
const PICKUP_RANGE = 2.5;
const MAX_INVENTORY = 5;

// Third-person camera settings
const CAM_DISTANCE = 3.5;
const CAM_HEIGHT = 1.8;
const CAM_LOOK_HEIGHT = 1.2;
const MOUSE_SENSITIVITY = 0.002;

// Hiding spot coordinates
const HIDING_SPOTS = [
    [-24, 8], [-24, 12], [-30, -5], [30, -5], [-5, 30], [5, -30], [0, 15],
    [-20, 10], [-16, 16], [-30, 30], [30, 30]
];

export function LocalPlayer({ socket, onBatteryChange, foods, onHidingChange, inventory, setInventory }) {
    const { camera, gl, scene } = useThree();
    const keys = usePlayerControls();

    const [torchOn, setTorchOn] = useState(true);
    const torchOnRef = useRef(true);
    const spotRef = useRef();
    const torchPointRef = useRef();

    const isHidingRef = useRef(false);
    const [animation, setAnimation] = useState('Idle');
    const animRef = useRef('Idle');
    const [thirdPerson, setThirdPerson] = useState(true); // Start in TPP

    // Player position (separate from camera)
    const playerPos = useRef(new THREE.Vector3(0, 0, 28));
    const playerModelRef = useRef();

    // Camera orbit angles
    const yaw = useRef(Math.PI);
    const pitch = useRef(0.3);
    const isLocked = useRef(false);

    const sendTimer = useRef(0);
    const fWasDown = useRef(false);
    const eWasDown = useRef(false);
    const vWasDown = useRef(false);
    const numKeysDown = useRef({});

    // Handle pointer lock manually
    useEffect(() => {
        const canvas = gl.domElement;

        const onClick = () => {
            canvas.requestPointerLock();
        };

        const onLockChange = () => {
            isLocked.current = document.pointerLockElement === canvas;
        };

        const onMouseMove = (e) => {
            if (!isLocked.current) return;
            yaw.current -= e.movementX * MOUSE_SENSITIVITY;
            pitch.current = Math.max(-0.5, Math.min(1.2, pitch.current + e.movementY * MOUSE_SENSITIVITY));
        };

        canvas.addEventListener('click', onClick);
        document.addEventListener('pointerlockchange', onLockChange);
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            canvas.removeEventListener('click', onClick);
            document.removeEventListener('pointerlockchange', onLockChange);
            document.removeEventListener('mousemove', onMouseMove);
        };
    }, [gl]);

    const toggleTorch = useCallback(() => {
        const newState = !torchOnRef.current;
        torchOnRef.current = newState;
        setTorchOn(newState);
        socket.emit('toggleTorch', { torchOn: newState });
    }, [socket]);

    // Pick up nearest food within range
    const tryPickupFood = useCallback(() => {
        if (!foods || inventory.length >= MAX_INVENTORY) return;
        const px = playerPos.current.x;
        const pz = playerPos.current.z;

        let nearest = null;
        let nearestDist = PICKUP_RANGE;

        for (const food of Object.values(foods)) {
            const dx = food.position[0] - px;
            const dz = food.position[2] - pz;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = food;
            }
        }

        if (nearest) {
            // Add to inventory and remove from world
            setInventory(prev => [...prev, nearest]);
            socket.emit('eatFood', { foodId: nearest.id }); // Remove from server
        }
    }, [foods, inventory, socket, setInventory]);

    // Use item from inventory
    const useItem = useCallback((slotIndex) => {
        if (slotIndex >= inventory.length) return;
        const item = inventory[slotIndex];
        if (item) {
            socket.emit('useItem', { healthRestore: item.healthRestore || 10 });
            setInventory(prev => prev.filter((_, i) => i !== slotIndex));
        }
    }, [inventory, socket, setInventory]);

    useFrame((state, delta) => {
        if (!isLocked.current) return;

        const isSprinting = !!keys.current['ShiftLeft'] || !!keys.current['ShiftRight'];
        const isCrouching = !!keys.current['KeyC'];

        let speed = MOVE_SPEED;
        if (isCrouching) speed = CROUCH_SPEED;
        else if (isSprinting) speed = SPRINT_SPEED;

        // Movement direction relative to camera yaw
        const dir = new THREE.Vector3();
        if (keys.current['KeyW']) dir.z -= 1;
        if (keys.current['KeyS']) dir.z += 1;
        if (keys.current['KeyA']) dir.x -= 1;
        if (keys.current['KeyD']) dir.x += 1;

        const isMoving = dir.lengthSq() > 0;

        if (isMoving) {
            dir.normalize();
            const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
            const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));

            const moveDir = new THREE.Vector3()
                .addScaledVector(forward, -dir.z)
                .addScaledVector(right, dir.x)
                .normalize();

            playerPos.current.addScaledVector(moveDir, speed * delta);

            const nextAnim = isSprinting ? 'Run' : 'Walk';
            if (animRef.current !== nextAnim) {
                animRef.current = nextAnim;
                setAnimation(nextAnim);
            }

            const targetAngle = Math.atan2(moveDir.x, moveDir.z);

            if (playerModelRef.current) {
                let currentRot = playerModelRef.current.rotation.y;
                let diff = targetAngle - currentRot;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                playerModelRef.current.rotation.y += diff * 0.08;
            }

            // Camera follows behind character (only in TPP)
            if (thirdPerson) {
                const targetYaw = targetAngle + Math.PI;
                let yawDiff = targetYaw - yaw.current;
                while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
                while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                yaw.current += yawDiff * 0.01;
            }
        } else {
            if (animRef.current !== 'Idle') {
                animRef.current = 'Idle';
                setAnimation('Idle');
            }
        }

        // Clamp player position to room bounds
        playerPos.current.x = Math.max(-ROOM_BOUND, Math.min(ROOM_BOUND, playerPos.current.x));
        playerPos.current.z = Math.max(-ROOM_BOUND, Math.min(ROOM_BOUND, playerPos.current.z));

        // Resolve collisions with obstacles (shelves, tables, walls, etc.)
        const resolved = resolveCollisions(playerPos.current.x, playerPos.current.z);
        playerPos.current.x = resolved.x;
        playerPos.current.z = resolved.z;

        const targetHeight = isCrouching ? CROUCH_HEIGHT : PLAYER_HEIGHT;
        playerPos.current.y += (targetHeight - playerPos.current.y) * 0.15;

        // ── CAMERA POSITIONING ──
        if (thirdPerson) {
            // TPP: Camera behind player
            const camX = playerPos.current.x + Math.sin(yaw.current) * CAM_DISTANCE;
            const camZ = playerPos.current.z + Math.cos(yaw.current) * CAM_DISTANCE;
            const camY = playerPos.current.y + CAM_HEIGHT - pitch.current * 2;

            camera.position.set(camX, camY, camZ);
            camera.lookAt(
                playerPos.current.x,
                playerPos.current.y + CAM_LOOK_HEIGHT,
                playerPos.current.z
            );
        } else {
            // FPP: Camera at player head position
            camera.position.set(
                playerPos.current.x,
                playerPos.current.y,
                playerPos.current.z
            );
            // Look direction from yaw/pitch
            const lookX = playerPos.current.x - Math.sin(yaw.current);
            const lookZ = playerPos.current.z - Math.cos(yaw.current);
            const lookY = playerPos.current.y - pitch.current * 2;
            camera.lookAt(lookX, lookY, lookZ);
        }

        // Update model position (only visible in TPP)
        if (playerModelRef.current) {
            playerModelRef.current.position.x = playerPos.current.x;
            playerModelRef.current.position.z = playerPos.current.z;
        }

        // ── HIDING LOGIC ──
        let nearSpot = false;
        if (isCrouching) {
            for (const spot of HIDING_SPOTS) {
                const dx = playerPos.current.x - spot[0];
                const dz = playerPos.current.z - spot[1];
                if (Math.sqrt(dx * dx + dz * dz) < 1.8) {
                    nearSpot = true;
                    break;
                }
            }
        }
        if (nearSpot !== isHidingRef.current) {
            isHidingRef.current = nearSpot;
            onHidingChange(nearSpot);
        }

        // ── KEY TOGGLES ──
        const fDown = keys.current['KeyF'];
        if (fDown && !fWasDown.current) toggleTorch();
        fWasDown.current = fDown;

        const eDown = keys.current['KeyE'];
        if (eDown && !eWasDown.current) tryPickupFood();
        eWasDown.current = eDown;

        // V to toggle FPP/TPP
        const vDown = keys.current['KeyV'];
        if (vDown && !vWasDown.current) setThirdPerson(prev => !prev);
        vWasDown.current = vDown;

        // Number keys 1-5 to use inventory items
        for (let i = 1; i <= 5; i++) {
            const key = `Digit${i}`;
            const down = keys.current[key];
            if (down && !numKeysDown.current[key]) useItem(i - 1);
            numKeysDown.current[key] = down;
        }

        // ── TORCH ──
        if (spotRef.current) {
            spotRef.current.position.copy(playerPos.current);
            spotRef.current.position.y += 1.5;
            spotRef.current.intensity = torchOnRef.current ? 150 : 0;

            const lookDir = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
            const targetPos = playerPos.current.clone().addScaledVector(lookDir, 10);
            targetPos.y += 1;
            spotRef.current.target.position.copy(targetPos);
            spotRef.current.target.updateMatrixWorld();
        }

        if (torchPointRef.current) {
            torchPointRef.current.position.copy(playerPos.current);
            torchPointRef.current.position.y += 1.5;
            torchPointRef.current.intensity = torchOnRef.current ? 20 : 0;
        }

        // ── SEND POSITION TO SERVER ──
        sendTimer.current += delta;
        if (sendTimer.current >= 1 / TRANSFORM_HZ) {
            sendTimer.current = 0;
            socket.emit('updateTransform', {
                position: [playerPos.current.x, playerPos.current.y, playerPos.current.z],
                rotation: [0, yaw.current, 0],
                modelRotation: playerModelRef.current ? playerModelRef.current.rotation.y : yaw.current,
                isHiding: isHidingRef.current
            });
        }
    });

    return (
        <>
            {/* Player model (only visible in TPP) */}
            {thirdPerson && (
                <group ref={playerModelRef} position={[playerPos.current.x, 0, playerPos.current.z]}>
                    <PlayerModel animation={animation} scale={0.6} />
                </group>
            )}

            <spotLight
                ref={spotRef}
                color="#ffffff"
                intensity={0}
                angle={Math.PI / 3}
                penumbra={0.3}
                distance={50}
                decay={1.5}
            />
            <pointLight
                ref={torchPointRef}
                color="#ffffff"
                intensity={0}
                distance={15}
                decay={2}
            />
        </>
    );
}
