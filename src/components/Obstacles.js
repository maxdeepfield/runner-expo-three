import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD_TREE_COLORS } from '../constants/treePalette';

const OBSTACLE_LANES = [-2.5, 0, 2.5]; // Left, Center, Right
const OBSTACLE_SPACING = 15;
const OBSTACLE_COUNT = 10;
const SEGMENTS_AHEAD = 5; // Keep 5 segments ahead
const SAFE_START_DISTANCE = 30; // Safe distance from player start (increased)

function Obstacle({ position, onCollision, onPass, playerPosition, gameStarted }) {
  const groupRef = useRef();
  const hasPassedRef = useRef(false);

  useFrame(() => {
    if (!groupRef.current || !playerPosition || !gameStarted) return;

    // Get world position of obstacle from the group
    const obstaclePos = new THREE.Vector3();
    groupRef.current.getWorldPosition(obstaclePos);

    const playerPos = playerPosition;

    // Check collision with player (considering both X and Z positions)
    const distanceX = Math.abs(obstaclePos.x - playerPos.x);
    const distanceZ = Math.abs(obstaclePos.z - playerPos.z);

    // Only check collision if obstacle is reasonably close to player
    // Collision if close in both X and Z, and obstacle is ahead or at player position
    if (distanceX < 0.9 && distanceZ < 1.5 && obstaclePos.z <= playerPos.z + 2) {
      onCollision();
    }

    // Check if obstacle passed player
    if (!hasPassedRef.current && obstaclePos.z > playerPos.z + 3) {
      hasPassedRef.current = true;
      onPass();
    }
  });

  const [treeColor] = useState(WORLD_TREE_COLORS[Math.floor(Math.random() * WORLD_TREE_COLORS.length)]);

  return (
    <group ref={groupRef} position={position}>
      {/* Tree-shaped obstacle */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[1.5, 3]} />
        <meshStandardMaterial color={treeColor} />
      </mesh>
    </group>
  );
  }

export default function Obstacles({ speed, onCollision, onPass, playerPosition, gameStarted = true }) {
  const [obstacles, setObstacles] = useState([]);

  // Initialize obstacles - distribute across visible segments
  useEffect(() => {
    const initialObstacles = [];
    // Start obstacles within visible range (5 segments ahead)
    // Each segment is about 50 units, so 5 segments = 250 units
    const visibleRange = OBSTACLE_SPACING * SEGMENTS_AHEAD * 2; // Spread across segments
    const startZ = -OBSTACLE_SPACING; // Start just ahead of player

    for (let i = 0; i < OBSTACLE_COUNT; i++) {
      // For the first few obstacles, avoid center lane to prevent immediate collision
      let lane;
      if (i < 3) {
        // First 3 obstacles: only left or right lane
        lane = OBSTACLE_LANES[Math.random() < 0.5 ? 0 : 2];
      } else {
        lane = OBSTACLE_LANES[Math.floor(Math.random() * OBSTACLE_LANES.length)];
      }
      initialObstacles.push({
        id: i,
        lane,
        z: startZ - i * OBSTACLE_SPACING,
      });
    }
    setObstacles(initialObstacles);
  }, []);

  useFrame(() => {
    if (!playerPosition) return;

    // Update obstacle positions
    setObstacles(prev => {
      const playerZ = playerPosition.z;
      const furthestAheadZ = Math.min(...prev.map(o => o.z));
      const segmentsAhead = Math.floor((playerZ - furthestAheadZ) / OBSTACLE_SPACING);

      return prev.map(obs => {
        const newZ = obs.z + speed;

        // Reset obstacle when it passes player or maintain 5 segments ahead
        if (newZ > playerZ + 5 || segmentsAhead < SEGMENTS_AHEAD) {
          const lane = OBSTACLE_LANES[Math.floor(Math.random() * OBSTACLE_LANES.length)];
          // Place new obstacle ahead of the furthest one to maintain segments ahead
          const newZPosition = furthestAheadZ - OBSTACLE_SPACING;
          return {
            ...obs,
            lane,
            z: newZPosition,
          };
        }

        return { ...obs, z: newZ };
      });
    });
  });

  return (
    <>
      {obstacles.map(obstacle => (
        <Obstacle
          key={obstacle.id}
          position={[obstacle.lane, 0, obstacle.z]}
          onCollision={onCollision}
          onPass={onPass}
          playerPosition={playerPosition}
          gameStarted={gameStarted}
        />
      ))}
    </>
  );
}
