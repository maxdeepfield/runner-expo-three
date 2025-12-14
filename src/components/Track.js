import { useMemo } from 'react';
import * as THREE from 'three';

export default function Track({ speed, playerPosition }) {
  const trackLength = 50;
  const trackWidth = 8;
  const SEGMENTS_AHEAD = 10;
  const SEGMENTS_BEHIND = 1; // Keep 1 segment behind player
  const TOTAL_SEGMENTS = SEGMENTS_AHEAD + SEGMENTS_BEHIND + 1;
  const TREE_SPACING = 5;

  const worldTreeColors = useMemo(() => [
    '#228B22', '#32CD32', '#006400', '#2E8B57', '#3CB371', '#20B2AA',
  ], []);

  const roadMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({ color: '#333333' });
  }, []);

  const playerZ = playerPosition?.z ?? 0;

  // Calculate which segment the player is in (segments go in negative Z direction)
  const currentSegmentIndex = Math.floor(-playerZ / trackLength);

  // Generate segments based on player position - absolute positioning, no drift
  const segments = useMemo(() => {
    const segs = [];
    for (let i = -SEGMENTS_BEHIND; i <= SEGMENTS_AHEAD; i++) {
      const segIndex = currentSegmentIndex + i;
      const segZ = -segIndex * trackLength; // Segment position in world space
      segs.push({ id: `segment-${segIndex}`, z: segZ });
    }
    return segs;
  }, [currentSegmentIndex]);

  // Generate trees based on player position - absolute positioning
  const trees = useMemo(() => {
    const treeElements = [];
    const startZ = -(currentSegmentIndex - SEGMENTS_BEHIND) * trackLength + trackLength;
    const endZ = -(currentSegmentIndex + SEGMENTS_AHEAD) * trackLength - trackLength;
    
    // Generate trees at fixed world positions
    const firstTreeZ = Math.ceil(endZ / TREE_SPACING) * TREE_SPACING;
    const lastTreeZ = Math.floor(startZ / TREE_SPACING) * TREE_SPACING;
    
    for (let z = firstTreeZ; z <= lastTreeZ; z += TREE_SPACING) {
      const colorIndex = Math.abs(Math.floor(z / 10)) % worldTreeColors.length;
      const color = worldTreeColors[colorIndex];
      treeElements.push({ id: `left-${z}`, side: 'left', z, color });
      treeElements.push({ id: `right-${z}`, side: 'right', z, color });
    }
    return treeElements;
  }, [currentSegmentIndex, worldTreeColors]);

  return (
    <>
      {segments.map(seg => (
        <group key={seg.id} position={[0, 0, seg.z]}>
          {/* Road - centered on segment position */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -trackLength / 2]} castShadow receiveShadow>
            <planeGeometry args={[trackWidth, trackLength]} />
            <primitive object={roadMaterial} />
          </mesh>

          {/* Lane markings */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -trackLength / 2]} castShadow receiveShadow>
            <planeGeometry args={[0.1, trackLength]} />
            <meshStandardMaterial color="#ffff00" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-trackWidth / 3, 0.01, -trackLength / 2]} castShadow receiveShadow>
            <planeGeometry args={[0.05, trackLength]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[trackWidth / 3, 0.01, -trackLength / 2]} castShadow receiveShadow>
            <planeGeometry args={[0.05, trackLength]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          {/* Grass on sides */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-trackWidth / 2 - 10, -0.01, -trackLength / 2]} castShadow receiveShadow>
            <planeGeometry args={[20, trackLength]} />
            <meshStandardMaterial color="#4a7c59" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[trackWidth / 2 + 10, -0.01, -trackLength / 2]} castShadow receiveShadow>
            <planeGeometry args={[20, trackLength]} />
            <meshStandardMaterial color="#4a7c59" />
          </mesh>
        </group>
      ))}

      {trees.map(tree => (
        <group
          key={tree.id}
          position={[
            tree.side === 'left' ? -trackWidth / 2 - 5 : trackWidth / 2 + 5,
            0,
            tree.z
          ]}
        >
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.5, 2]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <coneGeometry args={[1.5, 3]} />
            <meshStandardMaterial color={tree.color} />
          </mesh>
        </group>
      ))}
    </>
  );
}
