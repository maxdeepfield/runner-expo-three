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
    // Don't prevent default when game is over (allow tap to restart)
    if (gameOver) return;
    
    // Prevent default to stop browser navigation gestures (Telegram, etc.)
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    
    const touch = e.touches ? e.touches[0] : e;
    setStartX(touch.clientX || touch.pageX);
  };

  // Handle touch move - prevent scrolling/navigation
  const handleTouchMove = (e) => {
    if (gameOver) return;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  };

  // Handle touch end
  const handleTouchEnd = (e) => {
    if (gameOver) return;
    
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    
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

  // Prevent browser gestures on mount
  React.useEffect(() => {
    // Prevent pull-to-refresh and swipe navigation
    document.body.style.overscrollBehavior = 'none';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    document.documentElement.style.touchAction = 'none';
    
    return () => {
      document.body.style.overscrollBehavior = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overscrollBehavior = '';
      document.documentElement.style.touchAction = '';
    };
  }, []);

  return (
    <View
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <StatusBar barStyle="light-content" />
      <Canvas
        camera={{ position: [0, 5, 10], fov: 75 }}
        gl={{ antialias: false }}
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
          <Text style={styles.scoreText}>{Math.floor(score)}</Text>
        </View>
      )}

      {/* Game Over overlay */}
      {gameOver && (
        <View
          style={styles.gameOverContainer}
          onStartShouldSetResponder={() => true}
          onResponderRelease={restartGame}
          onTouchEnd={restartGame}
          onClick={restartGame}
        >
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.finalScoreText}>{Math.floor(finalScore)}</Text>
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
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scoreText: {
    color: '#333333',
    fontSize: 64,
    fontWeight: 'bold',
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
    color: '#FF6B6B',
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 20,
    // Removed text shadows for a cleaner look
  },
  finalScoreText: {
    color: '#333333',
    fontSize: 64,
    fontWeight: 'bold',
  },
});
