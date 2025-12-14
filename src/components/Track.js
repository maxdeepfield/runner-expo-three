import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Track({ speed, playerPosition }) {
  const trackLength = 50;
  const trackWidth = 8;
  const SEGMENTS_AHEAD = 10; // Increased for endless feel
  const SEGMENTS_BEHIND = 3; // Keep 3 segments behind player
  const TOTAL_SEGMENTS = SEGMENTS_AHEAD + SEGMENTS_BEHIND + 2; // ahead + behind + buffer

  // World tree colors - green tree-like colors
  const worldTreeColors = useMemo(() => [
    '#228B22', // Forest Green
    '#32CD32', // Lime Green
    '#006400', // Dark Green
    '#2E8B57', // Sea Green
    '#3CB371', // Medium Sea Green
    '#20B2AA', // Light Sea Green
  ], []);

  // Simple road material without canvas texture (React Native compatible)
  const roadMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({ color: '#333333' });
  }, []);


  // Dynamic segments based on player position for endless track
  const segments = useMemo(() => {
    const segs = [];
    const playerZ = playerPosition ? playerPosition.z : 0;
    const segmentIndex = Math.floor(playerZ / trackLength);
    const startSegment = segmentIndex - SEGMENTS_BEHIND;

    // Create segments both ahead and behind player
    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const segmentZ = (startSegment + i) * trackLength;

      segs.push(
        <group key={`segment-${startSegment + i}`} position={[0, 0, segmentZ]}>
          {/* Road */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -trackLength / 2]} receiveShadow>
            <planeGeometry args={[trackWidth, trackLength]} />
            <primitive object={roadMaterial} />
          </mesh>

          {/* Lane markings */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -trackLength / 2]} receiveShadow>
            <planeGeometry args={[0.1, trackLength]} />
            <meshStandardMaterial color="#ffff00" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-trackWidth / 3, 0.01, -trackLength / 2]} receiveShadow>
            <planeGeometry args={[0.05, trackLength]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[trackWidth / 3, 0.01, -trackLength / 2]} receiveShadow>
            <planeGeometry args={[0.05, trackLength]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          {/* Grass on sides */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-trackWidth / 2 - 10, -0.01, -trackLength / 2]} receiveShadow>
            <planeGeometry args={[20, trackLength]} />
            <meshStandardMaterial color="#4a7c59" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[trackWidth / 2 + 10, -0.01, -trackLength / 2]} receiveShadow>
            <planeGeometry args={[20, trackLength]} />
            <meshStandardMaterial color="#4a7c59" />
          </mesh>
        </group>
      );
    }

    return segs;
  }, [playerPosition?.z]); // Depend on player z for endless

  // Dynamic trees for endless coverage
  const trees = useMemo(() => {
    const treeElements = [];
    const playerZ = playerPosition ? playerPosition.z : 0;
    const segmentIndex = Math.floor(playerZ / trackLength);
    const startZ = (segmentIndex - SEGMENTS_BEHIND) * trackLength;
    const endZ = (segmentIndex + SEGMENTS_AHEAD) * trackLength;
    const spacing = 5; // Strict 5 units spacing
    const numTrees = Math.floor((endZ - startZ) / spacing);

    for (let i = 0; i < numTrees; i++) {
      const zPos = startZ + i * spacing;

      // Deterministic color based on z position
      const colorIndex = (Math.abs(Math.floor(zPos / 10)) % worldTreeColors.length);
      const treeColor = worldTreeColors[colorIndex];

      // Left side tree
      treeElements.push(
        <group key={`left-tree-${zPos}`} position={[-trackWidth / 2 - 5, 0, zPos]}>
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.5, 2]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <coneGeometry args={[1.5, 3]} />
            <meshStandardMaterial color={treeColor} />
          </mesh>
        </group>
      );

      // Right side tree
      treeElements.push(
        <group key={`right-tree-${zPos}`} position={[trackWidth / 2 + 5, 0, zPos]}>
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.5, 2]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <coneGeometry args={[1.5, 3]} />
            <meshStandardMaterial color={treeColor} />
          </mesh>
        </group>
      );
    }

    return treeElements;
  }, [playerPosition?.z]);

  return (
    <>
      {segments}
      {trees}
    </>
  );
}
