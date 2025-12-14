import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Player = forwardRef(({ position, speed, onGameOver, controls = { left: false, right: false } }, ref) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const positionRef = useRef(new THREE.Vector3(...position));
  const targetLaneRef = useRef(0);
  const prevControlsRef = useRef({ left: false, right: false });

  useImperativeHandle(ref, () => ({
    position: positionRef.current,
    getWorldPosition: () => {
      if (groupRef.current && meshRef.current) {
        const worldPos = new THREE.Vector3();
        meshRef.current.getWorldPosition(worldPos);
        return worldPos;
      }
      return positionRef.current;
    },
  }));

  // Handle button controls - snap to lanes (only on button press, not while held)
  useFrame(() => {
    // Check for button press (transition from false to true)
    const leftPressed = controls.left && !prevControlsRef.current.left;
    const rightPressed = controls.right && !prevControlsRef.current.right;
    
    if (leftPressed) {
      // Move left: from right(1) -> center(0), from center(0) -> left(-1)
      if (targetLaneRef.current === 1) {
        targetLaneRef.current = 0; // Right to center
      } else if (targetLaneRef.current === 0) {
        targetLaneRef.current = -1; // Center to left
      }
      // If already at left(-1), stay there
    } else if (rightPressed) {
      // Move right: from left(-1) -> center(0), from center(0) -> right(1)
      if (targetLaneRef.current === -1) {
        targetLaneRef.current = 0; // Left to center
      } else if (targetLaneRef.current === 0) {
        targetLaneRef.current = 1; // Center to right
      }
      // If already at right(1), stay there
    }
    
    // Update previous controls state
    prevControlsRef.current = { left: controls.left, right: controls.right };
  });

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Smooth lane transition
    const targetX = targetLaneRef.current * 2.5;
    positionRef.current.x = THREE.MathUtils.lerp(
      positionRef.current.x,
      targetX,
      delta * 5
    );

    // Move forward
    positionRef.current.z -= speed;

    // Update mesh position
    meshRef.current.position.copy(positionRef.current);

    // Simple rotation animation
    meshRef.current.rotation.y += delta * 2;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.8, 1.5, 0.8]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.2, 0.3, 0.4]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.2, 0.3, 0.4]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
});

Player.displayName = 'Player';

export default Player;

