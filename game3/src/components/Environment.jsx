import React, { useMemo } from 'react';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────── */
const ROOM_W = 70;
const ROOM_D = 70;
const ROOM_H = 9;
const hw = ROOM_W / 2;
const hd = ROOM_D / 2;

/* ─────────────────────────────────────────────────────────
   Shared Materials
───────────────────────────────────────────────────────── */
const M = {
    floor: new THREE.MeshStandardMaterial({ color: '#aaa', roughness: 0.8, metalness: 0 }),
    floorTile: new THREE.MeshStandardMaterial({ color: '#bbb', roughness: 0.85, metalness: 0 }),
    floorRed: new THREE.MeshStandardMaterial({ color: '#8a2222', roughness: 0.95, metalness: 0 }),
    floorWhite: new THREE.MeshStandardMaterial({ color: '#eee', roughness: 0.95, metalness: 0 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#666', roughness: 1 }),
    wall: new THREE.MeshStandardMaterial({ color: '#444', roughness: 0.95, side: THREE.DoubleSide }),
    wallAccent: new THREE.MeshStandardMaterial({ color: '#2a3060', roughness: 0.8, side: THREE.DoubleSide }),
    pillar: new THREE.MeshStandardMaterial({ color: '#333', roughness: 0.7 }),
    // Shelving
    shelfPost: new THREE.MeshStandardMaterial({ color: '#1a3a6a', roughness: 0.35, metalness: 0.7 }),
    shelfBoard: new THREE.MeshStandardMaterial({ color: '#444448', roughness: 0.6 }),
    box1: new THREE.MeshStandardMaterial({ color: '#8B6914', roughness: 0.9 }),
    box2: new THREE.MeshStandardMaterial({ color: '#A07828', roughness: 0.85 }),
    box3: new THREE.MeshStandardMaterial({ color: '#996622', roughness: 0.9 }),
    // Lights
    neonBlue: new THREE.MeshStandardMaterial({ color: '#0077ff', emissive: new THREE.Color('#0077ff'), emissiveIntensity: 4.0 }),
    lightTube: new THREE.MeshStandardMaterial({ color: '#fff', emissive: new THREE.Color('#ffffff'), emissiveIntensity: 2.0 }),
    lightBox: new THREE.MeshStandardMaterial({ color: '#333', roughness: 0.5, metalness: 0.3 }),
    // Furniture
    sofa: new THREE.MeshStandardMaterial({ color: '#2a4a7a', roughness: 0.75 }),
    sofaRed: new THREE.MeshStandardMaterial({ color: '#7a2a2a', roughness: 0.75 }),
    sofaGreen: new THREE.MeshStandardMaterial({ color: '#2a5a3a', roughness: 0.75 }),
    table: new THREE.MeshStandardMaterial({ color: '#4a3520', roughness: 0.6 }),
    tableLeg: new THREE.MeshStandardMaterial({ color: '#333', roughness: 0.4, metalness: 0.6 }),
    chair: new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: 0.7 }),
    counter: new THREE.MeshStandardMaterial({ color: '#555566', roughness: 0.4, metalness: 0.3 }),
    belt: new THREE.MeshStandardMaterial({ color: '#222', roughness: 0.7 }),
    // Props
    doorFrame: new THREE.MeshStandardMaterial({ color: '#555', roughness: 0.4, metalness: 0.5 }),
    crate: new THREE.MeshStandardMaterial({ color: '#2a2a1a', roughness: 0.95 }),
    barrel: new THREE.MeshStandardMaterial({ color: '#334', roughness: 0.5, metalness: 0.4 }),
    weapRack: new THREE.MeshStandardMaterial({ color: '#222', roughness: 0.3, metalness: 0.7 }),
    fridge: new THREE.MeshStandardMaterial({ color: '#ccc', roughness: 0.2, metalness: 0.6 }),
    bed: new THREE.MeshStandardMaterial({ color: '#4a4a6a', roughness: 0.8 }),
    bedSheet: new THREE.MeshStandardMaterial({ color: '#eee', roughness: 0.9 }),
    pallet: new THREE.MeshStandardMaterial({ color: '#5a3a1a', roughness: 0.95 }),
    exitSign: new THREE.MeshStandardMaterial({ color: '#030', emissive: new THREE.Color('#0f4'), emissiveIntensity: 1.5 }),
    sectionSign: new THREE.MeshStandardMaterial({ color: '#113', emissive: new THREE.Color('#36f'), emissiveIntensity: 1.2 }),
    balloon: new THREE.MeshStandardMaterial({ color: '#2255cc', roughness: 0.3, metalness: 0.1 }),
    balloonRed: new THREE.MeshStandardMaterial({ color: '#cc2244', roughness: 0.3, metalness: 0.1 }),
};

const boxMats = [M.box1, M.box2, M.box3];

/* ═══════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════ */

/* ─── SHELF ───────────────────────────────────────────── */
function Shelf({ position, rotation = [0, 0, 0], seed = 0 }) {
    const W = 3.5, D = 1.0, H = 4.2, n = 4;
    const r = (i) => Math.abs(Math.sin(seed * 127.1 + i * 311.7));
    return (
        <group position={position} rotation={rotation}>
            {[[-W / 2 + .08, H / 2, -D / 2 + .08], [W / 2 - .08, H / 2, -D / 2 + .08], [-W / 2 + .08, H / 2, D / 2 - .08], [W / 2 - .08, H / 2, D / 2 - .08]].map((p, i) => (
                <mesh key={i} position={p}><boxGeometry args={[.08, H, .08]} /><primitive object={M.shelfPost} attach="material" /></mesh>
            ))}
            {Array.from({ length: n }, (_, i) => { const y = .3 + (i * (H - .3) / n); return <mesh key={i} position={[0, y, 0]}><boxGeometry args={[W - .1, .06, D - .05]} /><primitive object={M.shelfBoard} attach="material" /></mesh> })}
            {Array.from({ length: n }, (_, si) => {
                const y = .3 + (si * (H - .3) / n) + .03, bh = .25 + r(si) * .2; return [
                    <mesh key={`a${si}`} position={[-.7 + r(si) * .3, y + bh / 2, 0]}><boxGeometry args={[.4, bh, .35]} /><primitive object={boxMats[si % 3]} attach="material" /></mesh>,
                    <mesh key={`b${si}`} position={[.5 + r(si + 5) * .3, y + bh / 2, 0]}><boxGeometry args={[.35, bh, .3]} /><primitive object={boxMats[(si + 1) % 3]} attach="material" /></mesh>
                ]
            })}
        </group>
    );
}

/* ─── SOFA ────────────────────────────────────────────── */
function Sofa({ position, rotation = [0, 0, 0], mat }) {
    const m = mat || M.sofa;
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, .25, 0]}><boxGeometry args={[2, .5, .9]} /><primitive object={m} attach="material" /></mesh>
            <mesh position={[0, .65, -.35]}><boxGeometry args={[2, .3, .2]} /><primitive object={m} attach="material" /></mesh>
            <mesh position={[-.9, .5, 0]}><boxGeometry args={[.2, .35, .9]} /><primitive object={m} attach="material" /></mesh>
            <mesh position={[.9, .5, 0]}><boxGeometry args={[.2, .35, .9]} /><primitive object={m} attach="material" /></mesh>
        </group>
    );
}

/* ─── DINING TABLE WITH CHAIRS ────────────────────────── */
function DiningSet({ position, rotation = [0, 0, 0] }) {
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, .75, 0]}><boxGeometry args={[2, .06, 1]} /><primitive object={M.table} attach="material" /></mesh>
            {[[-0.8, .375, -.35], [.8, .375, -.35], [-.8, .375, .35], [.8, .375, .35]].map((p, i) => (
                <mesh key={i} position={p}><boxGeometry args={[.06, .75, .06]} /><primitive object={M.tableLeg} attach="material" /></mesh>
            ))}
            {[[-0.8, 0, .85], [.8, 0, .85], [-.8, 0, -.85], [.8, 0, -.85]].map((x, i) => (
                <group key={`c${i}`} position={x}>
                    <mesh position={[0, .3, 0]}><boxGeometry args={[.45, .04, .45]} /><primitive object={M.chair} attach="material" /></mesh>
                    <mesh position={[0, .55, i < 2 ? .2 : -.2]}><boxGeometry args={[.45, .45, .04]} /><primitive object={M.chair} attach="material" /></mesh>
                </group>
            ))}
        </group>
    );
}

/* ─── BED ─────────────────────────────────────────────── */
function Bed({ position, rotation = [0, 0, 0] }) {
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, .2, 0]}><boxGeometry args={[1.2, .4, 2.2]} /><primitive object={M.bed} attach="material" /></mesh>
            <mesh position={[0, .42, 0]}><boxGeometry args={[1.1, .04, 2.1]} /><primitive object={M.bedSheet} attach="material" /></mesh>
            <mesh position={[0, .5, -1]}><boxGeometry args={[1.2, .25, .1]} /><primitive object={M.bed} attach="material" /></mesh>
        </group>
    );
}

/* ─── FRIDGE ──────────────────────────────────────────── */
function Fridge({ position, rotation = [0, 0, 0] }) {
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, 1, 0]}><boxGeometry args={[.8, 2, .7]} /><primitive object={M.fridge} attach="material" /></mesh>
            <mesh position={[.3, 1.2, .36]}><boxGeometry args={[.04, .12, .04]} /><primitive object={M.tableLeg} attach="material" /></mesh>
        </group>
    );
}

/* ─── WEAPON RACK ─────────────────────────────────────── */
function WeaponRack({ position, rotation = [0, 0, 0] }) {
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, 1.5, 0]}><boxGeometry args={[2.5, 3, .3]} /><primitive object={M.weapRack} attach="material" /></mesh>
            {[-0.8, 0, .8].map((x, i) => (
                <mesh key={i} position={[x, 1.5, .2]} rotation={[0, 0, Math.PI / 6]}><boxGeometry args={[.06, 1.2, .06]} /><primitive object={M.tableLeg} attach="material" /></mesh>
            ))}
        </group>
    );
}

/* ─── HIDING CRATE ────────────────────────────────────── */
function HidingCrate({ position, rotation = [0, 0, 0] }) {
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, .6, 0]}><boxGeometry args={[1.5, 1.2, 1.5]} /><primitive object={M.crate} attach="material" /></mesh>
            <mesh position={[0, 1.21, 0]}><boxGeometry args={[1.55, .04, 1.55]} /><primitive object={M.pallet} attach="material" /></mesh>
        </group>
    );
}

/* ─── BARREL STACK ────────────────────────────────────── */
function BarrelStack({ position }) {
    return (
        <group position={position}>
            <mesh position={[0, .5, 0]}><cylinderGeometry args={[.4, .4, 1, 8]} /><primitive object={M.barrel} attach="material" /></mesh>
            <mesh position={[.5, .5, .3]}><cylinderGeometry args={[.4, .4, 1, 8]} /><primitive object={M.barrel} attach="material" /></mesh>
            <mesh position={[.25, 1.4, .15]}><cylinderGeometry args={[.4, .4, 1, 8]} /><primitive object={M.barrel} attach="material" /></mesh>
        </group>
    );
}

/* ─── BALLOON CLUSTER ─────────────────────────────────── */
function BalloonCluster({ position }) {
    return (
        <group position={position}>
            {[[-0.3, 2.5, 0], [0.3, 2.8, 0.2], [0, 3, -0.2], [-.1, 2.2, .3], [.2, 2.6, -.1]].map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[.3, 8, 8]} /><primitive object={i % 2 === 0 ? M.balloon : M.balloonRed} attach="material" />
                </mesh>
            ))}
            {/* String */}
            <mesh position={[0, 1, 0]}><boxGeometry args={[.02, 2, .02]} /><primitive object={M.tableLeg} attach="material" /></mesh>
        </group>
    );
}

/* ─── DOOR WITH SUNLIGHT (no point light — just emissive glow) ── */
function Door({ position, rotation = [0, 0, 0], dayProgress }) {
    const sun = dayProgress < 0.5 ? Math.sin((dayProgress / 0.5) * Math.PI) : 0;
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, 2, 0]}><boxGeometry args={[2.5, 4, .15]} /><primitive object={M.doorFrame} attach="material" /></mesh>
            <mesh position={[0, 1.8, .1]}>
                <planeGeometry args={[2, 3.5]} />
                <meshStandardMaterial color="#dde" emissive="#ffffaa" emissiveIntensity={sun * 3} transparent opacity={sun > .01 ? .5 : .05} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

/* ─── CHECKERED FLOOR (simplified — just 4 large tiles) ── */
function CheckeredFloor({ position, size = [20, 16] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[size[0], size[1]]} /><primitive object={M.floorRed} attach="material" /></mesh>
            <mesh position={[-size[0] / 4, 0.015, -size[1] / 4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[size[0] / 2, size[1] / 2]} /><primitive object={M.floorWhite} attach="material" /></mesh>
            <mesh position={[size[0] / 4, 0.015, size[1] / 4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[size[0] / 2, size[1] / 2]} /><primitive object={M.floorWhite} attach="material" /></mesh>
        </group>
    );
}

/* ─── SECTION DIVIDER WALL ────────────────────────────── */
function SectionWall({ position, rotation = [0, 0, 0], width = 8, height = 3 }) {
    return (
        <mesh position={position} rotation={rotation}>
            <boxGeometry args={[width, height, .15]} />
            <primitive object={M.wallAccent} attach="material" />
        </mesh>
    );
}

/* ═══════════════════════════════════════════════════════
   MAIN ENVIRONMENT
═══════════════════════════════════════════════════════ */
export function Environment({ dayProgress = 0 }) {

    const ceilingLights = useMemo(() => {
        const lights = [];
        for (let x = -24; x <= 24; x += 16) {
            for (let z = -24; z <= 24; z += 16) {
                lights.push([x, ROOM_H - 0.1, z]);
            }
        }
        return lights;
    }, []);

    const doors = useMemo(() => [
        { pos: [-20, 0, -hd + .1], rot: [0, 0, 0] },
        { pos: [0, 0, -hd + .1], rot: [0, 0, 0] },
        { pos: [20, 0, -hd + .1], rot: [0, 0, 0] },
        { pos: [-20, 0, hd - .1], rot: [0, Math.PI, 0] },
        { pos: [0, 0, hd - .1], rot: [0, Math.PI, 0] },
        { pos: [20, 0, hd - .1], rot: [0, Math.PI, 0] },
    ], []);

    return (
        <group>
            {/* ═══════ STRUCTURE ═══════════════════════════ */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[ROOM_W, ROOM_D]} /><primitive object={M.floor} attach="material" /></mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}><planeGeometry args={[ROOM_W, ROOM_D]} /><primitive object={M.ceiling} attach="material" /></mesh>
            <mesh position={[0, ROOM_H / 2, -hd]}><planeGeometry args={[ROOM_W, ROOM_H]} /><primitive object={M.wall} attach="material" /></mesh>
            <mesh position={[0, ROOM_H / 2, hd]} rotation={[0, Math.PI, 0]}><planeGeometry args={[ROOM_W, ROOM_H]} /><primitive object={M.wall} attach="material" /></mesh>
            <mesh position={[-hw, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[ROOM_D, ROOM_H]} /><primitive object={M.wall} attach="material" /></mesh>
            <mesh position={[hw, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[ROOM_D, ROOM_H]} /><primitive object={M.wall} attach="material" /></mesh>

            {/* ═══════ 6 DOORS ═════════════════════════════ */}
            {doors.map((d, i) => <Door key={i} position={d.pos} rotation={d.rot} dayProgress={dayProgress} />)}

            {/* ═══════ BLUE NEON STRIPS (horizontal accents at 3m on all walls) */}
            <mesh position={[0, 3, -hd + .05]}><boxGeometry args={[ROOM_W - 2, .1, .06]} /><primitive object={M.neonBlue} attach="material" /></mesh>
            <mesh position={[0, 3, hd - .05]}><boxGeometry args={[ROOM_W - 2, .1, .06]} /><primitive object={M.neonBlue} attach="material" /></mesh>
            <mesh position={[-hw + .05, 3, 0]}><boxGeometry args={[.06, .1, ROOM_D - 2]} /><primitive object={M.neonBlue} attach="material" /></mesh>
            <mesh position={[hw - .05, 3, 0]}><boxGeometry args={[.06, .1, ROOM_D - 2]} /><primitive object={M.neonBlue} attach="material" /></mesh>
            {/* Blue accent lights — just 2 for perf */}
            <pointLight position={[0, 3, -hd + 2]} color="#06f" intensity={5} distance={35} decay={1.5} />
            <pointLight position={[0, 3, hd - 2]} color="#06f" intensity={5} distance={35} decay={1.5} />

            {/* ═══════ PILLARS ═════════════════════════════ */}
            {[[-22, 0, -22], [22, 0, -22], [-22, 0, 22], [22, 0, 22], [0, 0, 0], [-22, 0, 0], [22, 0, 0], [0, 0, -22], [0, 0, 22]].map((p, i) => (
                <mesh key={i} position={[p[0], ROOM_H / 2, p[2]]}><boxGeometry args={[1, ROOM_H, 1]} /><primitive object={M.pillar} attach="material" /></mesh>
            ))}

            {/* ═══════ CEILING LIGHTS (brighter!) ═════════ */}
            {ceilingLights.map((pos, i) => {
                const dp = dayProgress; // Use dayProgress directly
                // Peak the sun only during the first 50% (Daytime)
                const sunFactor = dp < 0.5 ? Math.sin((dp / 0.5) * Math.PI) : 0;
                return (
                    <group key={i}>
                        <mesh position={pos}><boxGeometry args={[.3, .08, 3]} /><primitive object={M.lightBox} attach="material" /></mesh>
                        <mesh position={[pos[0], pos[1] - .06, pos[2]]}>
                            <boxGeometry args={[.12, .04, 2.8]} />
                            <meshStandardMaterial
                                color="#fff"
                                emissive="#ffffff"
                                emissiveIntensity={0.5 + sunFactor * 3}
                            />
                        </mesh>
                        <pointLight
                            position={[pos[0], pos[1] - .5, pos[2]]}
                            color="#fff"
                            intensity={4 + sunFactor * 24}
                            distance={30}
                            decay={1.2}
                        />
                    </group>
                );
            })}

            {/* ═══════════════════════════════════════════════
               ENTRANCE AREA (z = 28 to 34) — Balloons + Welcome
            ═══════════════════════════════════════════════ */}
            <BalloonCluster position={[-10, 0, 30]} />
            <BalloonCluster position={[10, 0, 30]} />
            <BalloonCluster position={[-6, 0, 32]} />
            <BalloonCluster position={[6, 0, 32]} />

            {/* ═══════════════════════════════════════════════
               SECTION A: GROCERY / FOOD AISLES
               Location: x = -30 to -5, z = -30 to -5
               Like the video: parallel tall shelves with narrow aisles
            ═══════════════════════════════════════════════ */}
            <SectionWall position={[-17, 1.5, -4]} width={26} height={3} />
            <mesh position={[-17, ROOM_H - 1, -5]}><boxGeometry args={[4, .6, .08]} /><primitive object={M.sectionSign} attach="material" /></mesh>
            {/* 4 parallel shelf aisles */}
            {[-28, -22, -16, -10].map(x =>
                [-28, -22, -16, -10].map(z => (
                    <Shelf key={`ga-${x}-${z}`} position={[x, 0, z]} seed={x * 77 + z} />
                ))
            )}
            {/* Fridges along back wall */}
            <Fridge position={[-30, 0, -30]} />
            <Fridge position={[-28, 0, -30]} />
            <Fridge position={[-26, 0, -30]} />
            <Fridge position={[-24, 0, -30]} />

            {/* ═══════════════════════════════════════════════
               SECTION B: FOOD COURT / DINER
               Location: x = 5 to 30, z = -30 to -10
               Checkered floor, tables & chairs
            ═══════════════════════════════════════════════ */}
            <CheckeredFloor position={[17, 0, -20]} size={[20, 16]} />
            <SectionWall position={[4, 1.5, -20]} rotation={[0, Math.PI / 2, 0]} width={16} height={3} />
            <mesh position={[5, ROOM_H - 1, -20]}><boxGeometry args={[4, .6, .08]} /><primitive object={M.sectionSign} attach="material" /></mesh>
            {/* Dining tables */}
            <DiningSet position={[10, 0, -25]} />
            <DiningSet position={[16, 0, -25]} />
            <DiningSet position={[22, 0, -25]} />
            <DiningSet position={[10, 0, -18]} />
            <DiningSet position={[16, 0, -18]} />
            <DiningSet position={[22, 0, -18]} />
            {/* Counter / kitchen */}
            <mesh position={[28, 0.5, -15]}><boxGeometry args={[3, 1, 8]} /><primitive object={M.counter} attach="material" /></mesh>
            <Fridge position={[30, 0, -20]} rotation={[0, -Math.PI / 2, 0]} />
            <Fridge position={[30, 0, -18]} rotation={[0, -Math.PI / 2, 0]} />

            {/* ═══════════════════════════════════════════════
               SECTION C: FURNITURE SHOWROOM
               Location: x = 5 to 30, z = -5 to 15
               Sofas, beds, display rooms
            ═══════════════════════════════════════════════ */}
            <SectionWall position={[4, 1.5, 5]} rotation={[0, Math.PI / 2, 0]} width={20} height={3} />
            <mesh position={[5, ROOM_H - 1, 5]}><boxGeometry args={[4, .6, .08]} /><primitive object={M.sectionSign} attach="material" /></mesh>
            {/* Living Room Display 1 */}
            <Sofa position={[10, 0, 0]} mat={M.sofa} />
            <Sofa position={[14, 0, 0]} mat={M.sofaRed} />
            <DiningSet position={[20, 0, 0]} />
            {/* Living Room Display 2 */}
            <Sofa position={[10, 0, 6]} rotation={[0, Math.PI, 0]} mat={M.sofaGreen} />
            <Sofa position={[14, 0, 6]} rotation={[0, Math.PI, 0]} mat={M.sofa} />
            {/* Bedroom Display */}
            <Bed position={[22, 0, 4]} rotation={[0, Math.PI / 4, 0]} />
            <Bed position={[28, 0, 8]} />
            {/* Some display shelves */}
            <Shelf position={[26, 0, 0]} seed={501} />

            {/* ═══════════════════════════════════════════════
               SECTION D: WEAPONS / TACTICAL STORE
               Location: x = -30 to -5, z = 5 to 25
            ═══════════════════════════════════════════════ */}
            <SectionWall position={[-4, 1.5, 15]} rotation={[0, Math.PI / 2, 0]} width={20} height={3} />
            <mesh position={[-5, ROOM_H - 1, 15]}><boxGeometry args={[4, .6, .08]} /><primitive object={M.sectionSign} attach="material" /></mesh>
            {/* Weapon racks against the wall */}
            <WeaponRack position={[-30, 0, 8]} rotation={[0, Math.PI / 2, 0]} />
            <WeaponRack position={[-30, 0, 14]} rotation={[0, Math.PI / 2, 0]} />
            <WeaponRack position={[-30, 0, 20]} rotation={[0, Math.PI / 2, 0]} />
            {/* Ammo crates & barrels */}
            <HidingCrate position={[-24, 0, 8]} />
            <HidingCrate position={[-24, 0, 12]} />
            <BarrelStack position={[-20, 0, 10]} />
            <BarrelStack position={[-16, 0, 16]} />
            {/* Display shelves */}
            <Shelf position={[-18, 0, 8]} seed={801} />
            <Shelf position={[-12, 0, 8]} seed={802} />
            <Shelf position={[-18, 0, 20]} seed={803} />
            <Shelf position={[-12, 0, 20]} seed={804} />

            {/* ═══════════════════════════════════════════════
               SECTION E: WAREHOUSE / STORAGE (Back area)
               Location: x = 5 to 30, z = 18 to 30
               Dense shelves, pallets, industrial feel
            ═══════════════════════════════════════════════ */}
            <mesh position={[17, ROOM_H - 1, 18]}><boxGeometry args={[4, .6, .08]} /><primitive object={M.sectionSign} attach="material" /></mesh>
            {[10, 16, 22, 28].map(x =>
                [20, 26].map(z => (
                    <Shelf key={`ws-${x}-${z}`} position={[x, 0, z]} seed={x * 33 + z} />
                ))
            )}
            {/* Pallets */}
            {[[12, 0, 24], [24, 0, 28]].map((p, i) => (
                <group key={`pal${i}`} position={p}>
                    {[-.4, 0, .4].map((z, j) => <mesh key={j} position={[0, .12, z]}><boxGeometry args={[1.2, .03, .25]} /><primitive object={M.pallet} attach="material" /></mesh>)}
                </group>
            ))}

            {/* ═══════════════════════════════════════════════
               CHECKOUT LANES (center-south)
            ═══════════════════════════════════════════════ */}
            {[-12, -4, 4, 12].map((x, i) => (
                <group key={`co${i}`} position={[x, 0, 28]}>
                    <mesh position={[0, .45, 0]}><boxGeometry args={[1.2, .9, 2.5]} /><primitive object={M.counter} attach="material" /></mesh>
                    <mesh position={[0, .91, 0]}><boxGeometry args={[.8, .02, 2.2]} /><primitive object={M.belt} attach="material" /></mesh>
                </group>
            ))}

            {/* ═══════════════════════════════════════════════
               HIDING SPOTS scattered around
            ═══════════════════════════════════════════════ */}
            <HidingCrate position={[-30, 0, -5]} />
            <HidingCrate position={[30, 0, -5]} />
            <HidingCrate position={[-5, 0, 30]} />
            <HidingCrate position={[5, 0, -30]} />
            <HidingCrate position={[0, 0, 15]} rotation={[0, .5, 0]} />
            <BarrelStack position={[-30, 0, 30]} />
            <BarrelStack position={[30, 0, 30]} />

            {/* ═══════ EXIT SIGN ══════════════════════════ */}
            <mesh position={[0, ROOM_H - .5, hd - .05]}><planeGeometry args={[2, .5]} /><primitive object={M.exitSign} attach="material" /></mesh>
        </group>
    );
}
