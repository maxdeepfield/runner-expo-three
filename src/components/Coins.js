import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COIN_LANES = [-2.5, 0, 2.5]; // Left, Center, Right
const COIN_SPACING = 10;
const COIN_COUNT = 15;
const SEGMENTS_AHEAD = 5; // Keep 5 segments ahead

function Coin({ position, onCollect, playerPosition, gameStarted, collected }) {
    const groupRef = useRef();
    const hasBeenCollectedRef = useRef(false);
    const rotationRef = useRef(0);
    const bobOffsetRef = useRef(Math.random() * Math.PI * 2); // Random start position for bobbing

    // Reset collected state when coin is respawned (collected prop changes to false)
    useEffect(() => {
        if (!collected) {
            hasBeenCollectedRef.current = false;
            if (groupRef.current) {
                groupRef.current.visible = true;
            }
        }
    }, [collected, position[2]]); // Reset when z position changes significantly (respawn)

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
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
                <meshStandardMaterial
                    color="#FFEA00"
                    emissive="#FFD700"
                    emissiveIntensity={0.3}
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
                collected: false,
            });
        }
        setCoins(initialCoins);
    }, []);

    const handleCoinCollect = (coinId) => {
        setCoins(prev => prev.map(coin => 
            coin.id === coinId ? { ...coin, collected: true } : coin
        ));
        onCollect();
    };

    useFrame(() => {
        if (!playerPosition) return;

        // Update coin positions
        setCoins(prev => {
            const playerZ = playerPosition.z;
            const furthestAheadZ = Math.min(...prev.map(c => c.z));

            return prev.map(coin => {
                const newZ = coin.z + speed;

                // Reset coin when it passes player
                if (newZ > playerZ + 5) {
                    const lane = COIN_LANES[Math.floor(Math.random() * COIN_LANES.length)];
                    // Place new coin ahead of the furthest one
                    const newZPosition = furthestAheadZ - COIN_SPACING - Math.random() * COIN_SPACING;
                    return {
                        ...coin,
                        lane,
                        z: newZPosition,
                        collected: false, // Reset collected state
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
                    onCollect={() => handleCoinCollect(coin.id)}
                    playerPosition={playerPosition}
                    gameStarted={gameStarted}
                    collected={coin.collected}
                />
            ))}
        </>
    );
}