import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COIN_LANES = [-2.5, 0, 2.5]; // Left, Center, Right
const COIN_SPACING = 10;
const COIN_COUNT = 15;
const SEGMENTS_AHEAD = 5; // Keep 5 segments ahead

function Coin({ position, onCollect, playerPosition, gameStarted }) {
    const groupRef = useRef();
    const hasBeenCollectedRef = useRef(false);
    const rotationRef = useRef(0);
    const bobOffsetRef = useRef(Math.random() * Math.PI * 2); // Random start position for bobbing

    useFrame((state, delta) => {
        if (!groupRef.current || !playerPosition || !gameStarted || hasBeenCollectedRef.current) return;

        // Rotate the coin continuously around its vertical axis
        rotationRef.current += delta * 3; // Faster rotation
        groupRef.current.rotation.y = rotationRef.current;

        // Bobbing animation (up/down movement)
        const bobAmount = Math.sin(state.clock.elapsedTime * 2 + bobOffsetRef.current) * 0.3;
        groupRef.current.position.y = 1.5 + bobAmount;

        // Get world position of coin from the group
        const coinPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(coinPos);

        const playerPos = playerPosition;

        // Check collection with player (considering both X and Z positions)
        const distanceX = Math.abs(coinPos.x - playerPos.x);
        const distanceZ = Math.abs(coinPos.z - playerPos.z);

        // Collect coin if close in both X and Z
        if (distanceX < 1.2 && distanceZ < 1.5 && coinPos.z <= playerPos.z + 2) {
            hasBeenCollectedRef.current = true;
            groupRef.current.visible = false; // Hide the coin
            onCollect();
        }
    });

    return (
        <group ref={groupRef} position={[position[0], position[1], position[2]]}>
            {/* Bright gold coin with vertical orientation */}
            <mesh castShadow rotation={[Math.PI / 2, 0, 0]}> {/* Rotate 90 degrees to stand vertically */}
                <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} /> {/* Thinner coin */}
                <meshStandardMaterial
                    color="#FFEA00" // Brighter gold
                    emissive="#FFD700" // Add glow
                    emissiveIntensity={0.2}
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>
        </group>
    );
}

export default function Coins({ speed, onCollect, playerPosition, gameStarted = true }) {
    const [coins, setCoins] = useState([]);

    // Initialize coins - distribute across visible segments
    useEffect(() => {
        const initialCoins = [];
        // Start coins within visible range
        const startZ = -COIN_SPACING; // Start just ahead of player

        for (let i = 0; i < COIN_COUNT; i++) {
            const lane = COIN_LANES[Math.floor(Math.random() * COIN_LANES.length)];
            initialCoins.push({
                id: `coin-${i}`,
                lane,
                z: startZ - i * COIN_SPACING,
            });
        }
        setCoins(initialCoins);
    }, []);

    useFrame(() => {
        if (!playerPosition) return;

        // Update coin positions
        setCoins(prev => {
            const playerZ = playerPosition.z;
            const furthestAheadZ = Math.min(...prev.map(c => c.z));
            const segmentsAhead = Math.floor((playerZ - furthestAheadZ) / COIN_SPACING);

            return prev.map(coin => {
                const newZ = coin.z + speed;

                // Reset coin when it passes player or maintain segments ahead
                if (newZ > playerZ + 5 || segmentsAhead < SEGMENTS_AHEAD) {
                    const lane = COIN_LANES[Math.floor(Math.random() * COIN_LANES.length)];
                    // Place new coin ahead of the furthest one to maintain segments ahead
                    const newZPosition = furthestAheadZ - COIN_SPACING;
                    return {
                        ...coin,
                        lane,
                        z: newZPosition,
                    };
                }

                return { ...coin, z: newZ };
            });
        });
    });

    return (
        <>
            {coins.map(coin => (
                <Coin
                    key={coin.id}
                    position={[coin.lane, 1.5, coin.z]}
                    onCollect={onCollect}
                    playerPosition={playerPosition}
                    gameStarted={gameStarted}
                />
            ))}
        </>
    );
}