import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Track({ speed, playerPosition }) {
  const trackLength = 50;
  const trackWidth = 8;
  const SEGMENTS_AHEAD = 5;
  const SEGMENTS_BEHIND = 3; // Keep 3 segments behind player
  const TOTAL_SEGMENTS = SEGMENTS_AHEAD + SEGMENTS_BEHIND + 2; // ahead + behind + buffer
  const [segments, setSegments] = useState([]);
  const [envCubes, setEnvCubes] = useState([]); // Separate state for environment cubes

  /**
   * Создаёт массив кубов окружения для заданного сегмента.
   * Кубы распределяются по бокам сегмента с уникальными id,
   * основанными на id сегмента и его Z-позиции.
   */
  const generateCubesForSegment = (segmentId, segmentZ) => {
    const cubes = [];
    for (let i = 0; i < 5; i++) {
      const zPos = segmentZ - trackLength / 2 + (i * trackLength) / 4;
      const leftColor = worldCubeColors[Math.floor(Math.random() * worldCubeColors.length)];
      cubes.push({
        id: `seg-${segmentId}-z-${segmentZ}-left-${i}`,
        x: -trackWidth / 2 - 10,
        y: 1,
        z: zPos,
        color: leftColor,
      });
      const rightColor = worldCubeColors[Math.floor(Math.random() * worldCubeColors.length)];
      cubes.push({
        id: `seg-${segmentId}-z-${segmentZ}-right-${i}`,
        x: trackWidth / 2 + 10,
        y: 1,
        z: zPos,
        color: rightColor,
      });
    }
    return cubes;
  };

  // World cube colors - green bush-like colors
  const worldCubeColors = useMemo(() => [
    '#228B22', // Forest Green
    '#32CD32', // Lime Green
    '#006400', // Dark Green
    '#2E8B57', // Sea Green
    '#3CB371', // Medium Sea Green
    '#20B2AA', // Light Sea Green
  ], []);

  // Initialize track segments and environment cubes
  useEffect(() => {
    const initialSegments = [];
    const initialCubes = [];

    // Start segments both ahead and behind player
    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      initialSegments.push({
        id: i,
        z: (SEGMENTS_BEHIND - i) * trackLength, // Start with segments behind and ahead
      });
    }

    // Create environment cubes that align with segments for better distribution
    // Generate cubes along the sides of each segment
    for (let segmentIdx = 0; segmentIdx < TOTAL_SEGMENTS; segmentIdx++) {
      const segmentZ = (SEGMENTS_BEHIND - segmentIdx) * trackLength;

      // Create 5 cubes per segment side (left and right)
      for (let i = 0; i < 5; i++) {
        const zPos = segmentZ - trackLength / 2 + (i * trackLength) / 4;

        // Left side cube
        const leftColor = worldCubeColors[Math.floor(Math.random() * worldCubeColors.length)];
        initialCubes.push({
          id: `left-cube-${segmentIdx}-${i}`,
          x: -trackWidth / 2 - 10,
          y: 1,
          z: zPos,
          color: leftColor
        });

        // Right side cube
        const rightColor = worldCubeColors[Math.floor(Math.random() * worldCubeColors.length)];
        initialCubes.push({
          id: `right-cube-${segmentIdx}-${i}`,
          x: trackWidth / 2 + 10,
          y: 1,
          z: zPos,
          color: rightColor
        });
      }
    }

    setSegments(initialSegments);
    setEnvCubes(initialCubes);
  }, []);

  useFrame(() => {
    if (!playerPosition) return;

    const playerZ = playerPosition.z;
    const cameraZ = playerZ + 10; // Camera is behind player

    // Обновляем позиции сегментов и собираем события ресета
    let updatedSegments = segments.map(seg => ({
      ...seg,
      z: seg.z + speed,
    }));

    // Сортировка по Z
    updatedSegments.sort((a, b) => a.z - b.z);

    // Порог для ресета сегментов (слишком далеко позади камеры)
    const segmentsBehindDistance = SEGMENTS_BEHIND * trackLength;
    const resetThreshold = cameraZ + segmentsBehindDistance;

    // Ресет далёких сегментов и сбор новых Z для генерации окружения
    const segmentsToReset = updatedSegments.filter(seg => seg.z > resetThreshold);
    const spawnForSegments = [];
    if (segmentsToReset.length > 0) {
      const furthestAhead = Math.min(...updatedSegments.map(s => s.z));

      segmentsToReset.forEach((seg, index) => {
        const newZUnsnapped = furthestAhead - trackLength * (index + 1);
        const newZ = Math.round(newZUnsnapped / trackLength) * trackLength;
        seg.z = newZ;
        spawnForSegments.push({ id: seg.id, z: newZ });
      });
    }

    // Повторная сортировка
    updatedSegments.sort((a, b) => a.z - b.z);

    // Выравнивание расстояний между сегментами
    for (let i = 1; i < updatedSegments.length; i++) {
      const prevZ = updatedSegments[i - 1].z;
      const expectedZ = prevZ + trackLength;
      const currentZ = updatedSegments[i].z;

      if (Math.abs(currentZ - expectedZ) > 0.5) {
        updatedSegments[i].z = expectedZ;
      }
    }

    // Применяем новые сегменты
    setSegments(updatedSegments);

    // Двигаем и обновляем окружение: удаляем слишком далёкие кубы и добавляем новые для ресетнутых сегментов
    setEnvCubes(prev => {
      const moved = prev
        .map(cube => ({ ...cube, z: cube.z + speed }))
        .filter(cube => cube.z <= resetThreshold + trackLength); // удаляем кубы намного позади

      const existingIds = new Set(moved.map(c => c.id));
      const toAdd = [];
      for (const s of spawnForSegments) {
        const cubes = generateCubesForSegment(s.id, s.z);
        for (const c of cubes) {
          if (!existingIds.has(c.id)) {
            toAdd.push(c);
          }
        }
      }
      return moved.concat(toAdd);
    });
  });

  // Simple road material without canvas texture (React Native compatible)
  const roadMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({ color: '#333333' });
  }, []);

  return (
    <>
      {segments.map(segment => (
        <group key={segment.id} position={[0, 0, segment.z]}>
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
      ))}

      {/* Persistent environment cubes - aligned with segments */}
      {envCubes.map(cube => (
        <mesh
          key={cube.id}
          position={[cube.x, cube.y, cube.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color={cube.color} />
        </mesh>
      ))}
    </>
  );
}
