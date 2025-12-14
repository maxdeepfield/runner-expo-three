import React from 'react';
import { StyleSheet, View, StatusBar, Text } from 'react-native';
import { Canvas } from '@react-three/fiber';
import Game from './src/components/Game';

export default function App() {
  const [controls, setControls] = React.useState({ left: false, right: false });
  const [score, setScore] = React.useState(0);
  const [finalScore, setFinalScore] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const [gameKey, setGameKey] = React.useState('initial');

  // Swipe detection state
  const [startX, setStartX] = React.useState(0);

  // Handle touch start
  const handleTouchStart = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    setStartX(touch.clientX || touch.pageX);
  };

  // Handle touch end
  const handleTouchEnd = (e) => {
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const endX = touch.clientX || touch.pageX;
    const diff = startX - endX;

    // Minimum swipe distance
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left
        setControls({ left: true, right: false });
        setTimeout(() => setControls({ left: false, right: false }), 100);
      } else {
        // Swipe right
        setControls({ left: false, right: true });
        setTimeout(() => setControls({ left: false, right: false }), 100);
      }
    }
  };

  // Restart game function
  const restartGame = () => {
    setFinalScore(score); // Store the final score before resetting
    setGameOver(false);
    setScore(0);
    setControls({ left: false, right: false });
    setGameKey(prev => prev + '-restart'); // Change key to force remount
  };

  return (
    <View
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <StatusBar barStyle="light-content" />
      <Canvas
        camera={{ position: [0, 5, 10], fov: 75 }}
        gl={{ antialias: true, shadowMap: true }}
        shadows
      >
        <Game
          key={gameKey}
          controls={controls}
          onScoreUpdate={setScore}
          onGameOver={() => {
            setFinalScore(score); // Store the final score when game ends
            setGameOver(true);
          }}
        />
      </Canvas>

      {/* Score display */}
      {!gameOver && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {Math.floor(score)}</Text>
        </View>
      )}

      {/* Game Over overlay */}
      {gameOver && (
        <View
          style={styles.gameOverContainer}
          onStartShouldSetResponder={() => true}
          onResponderRelease={restartGame}
        >
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.finalScoreText}>Final Score: {Math.floor(finalScore)}</Text>
          <Text style={styles.restartText}>Tap to Restart</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  scoreContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    alignItems: 'flex-start',
  },
  scoreText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // More transparent bright white overlay
  },
  gameOverText: {
    color: '#FF6B6B', // Reddish color that works well on bright background
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
    // Removed text shadows for a cleaner look
  },
  finalScoreText: {
    color: '#333333', // Dark gray for better contrast on bright background
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    // Removed text shadows for a cleaner look
  },
  restartText: {
    color: '#666666', // Medium gray for subtle appearance
    fontSize: 18,
    fontStyle: 'italic',
    // Removed text shadows for a cleaner look
  },
});
