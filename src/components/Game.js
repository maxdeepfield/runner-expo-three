import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Player from './Player';
import Track from './Track';
import Obstacles from './Obstacles';
import Coins from './Coins';

export default function Game({ controls = { left: false, right: false }, onScoreUpdate, onGameOver }) {
  const [gameState, setGameState] = useState({
    score: 0,
    gameOver: false,
    speed: 0.1,
    paused: false,
  });

  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1, 0));
  const [gameStarted, setGameStarted] = useState(false);
  const cameraRef = useRef();
  const { camera } = useThree();
  const playerRef = useRef();
  const startDelayRef = useRef(0);

  // Reset game state when component mounts
  useEffect(() => {
    setGameState({
      score: 0,
      gameOver: false,
      speed: 0.1,
      paused: false,
    });
    setPlayerPosition(new THREE.Vector3(0, 1, 0));
    setGameStarted(false);
    startDelayRef.current = 0;
  }, []);

  // Handle visibility change (tab focus/blur)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setGameState(prev => ({
        ...prev,
        paused: document.hidden,
      }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useFrame((state, delta) => {
    if (gameState.gameOver || gameState.paused) return;

    // Small delay before starting collision detection to ensure everything is initialized
    startDelayRef.current += delta;
    if (startDelayRef.current > 0.5 && !gameStarted) {
      setGameStarted(true);
    }

    // Update camera to follow player
    if (playerRef.current) {
      // Get world position of player
      const getWorldPos = playerRef.current.getWorldPosition;
      let pos;
      if (getWorldPos) {
        pos = getWorldPos();
      } else {
        // Fallback: use position ref directly
        pos = playerRef.current.position;
      }

      const worldPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      setPlayerPosition(worldPos.clone());

      // Camera follows behind and above player
      // Moved camera farther back from player (8 units behind instead of 5)
      const targetCameraPos = new THREE.Vector3(worldPos.x, worldPos.y + 5, worldPos.z + 8);

      // Look slightly ahead of player to see farther down the track
      const lookAheadPos = new THREE.Vector3(worldPos.x, worldPos.y + 2, worldPos.z - 10);

      camera.position.lerp(targetCameraPos, 0.2);
      camera.lookAt(lookAheadPos);
    }

    // Increase speed over time and update score
    setGameState(prev => {
      // Only update score and speed if game is not over or paused
      if (prev.gameOver || prev.paused) {
        return prev;
      }

      const newScore = prev.score + delta * 10;
      if (onScoreUpdate) onScoreUpdate(Math.floor(newScore));
      return {
        ...prev,
        speed: Math.min(prev.speed + delta * 0.001, 0.3),
        score: newScore,
      };
    });
  });

  const handleGameOver = () => {
    setGameState(prev => ({ ...prev, gameOver: true }));
    if (onGameOver) onGameOver();
  };

  const handleObstaclePass = () => {
    setGameState(prev => ({ ...prev, score: prev.score + 100 }));
  };

  const handleCoinCollect = () => {
    setGameState(prev => ({ ...prev, score: prev.score + 50 }));
  };

  return (
    <>
      {/* Enhanced Lighting for Brighter Scene */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 5]}
        intensity={2.5} // Further increased sun intensity
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={150}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.7} />
      <pointLight position={[10, 10, -5]} intensity={0.5} /> {/* Additional light for better illumination */}

      <Player
        ref={playerRef}
        position={[0, 1, 0]}
        speed={gameState.speed}
        onGameOver={handleGameOver}
        controls={controls}
      />

      <Track speed={gameState.speed} playerPosition={playerPosition} />

      <Obstacles
        speed={gameState.speed}
        onCollision={handleGameOver}
        onPass={handleObstaclePass}
        playerPosition={playerPosition}
        gameStarted={gameStarted && !gameState.gameOver && !gameState.paused}
      />

      <Coins
        speed={gameState.speed}
        onCollect={handleCoinCollect}
        playerPosition={playerPosition}
        gameStarted={gameStarted && !gameState.gameOver && !gameState.paused}
      />

    </>
  );
}