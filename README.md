# 3D Runner Game - Expo + React Three Fiber

A 3D endless runner game built with Expo and React Three Fiber.

## Features

- 3D graphics using React Three Fiber
- Smooth player movement with lane switching
- Procedurally generated obstacles
- Score system
- Increasing difficulty (speed increases over time)

## Controls

- **Swipe Left/Right**: Switch lanes to avoid obstacles
- The game automatically moves forward

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on your device

## Project Structure

```
├── App.js                 # Main app component
├── src/
│   └── components/
│       ├── Game.js        # Main game logic and state
│       ├── Player.js      # Player character component
│       ├── Track.js       # Road/track component
│       └── Obstacles.js   # Obstacle generation and management
```

## Technologies

- **Expo**: React Native framework
- **React Three Fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for R3F
- **Three.js**: 3D graphics library

## Development

The game uses a component-based architecture where:
- `Game.js` manages overall game state and coordinates components
- `Player.js` handles player movement and controls
- `Track.js` renders the road with lane markings
- `Obstacles.js` generates and manages obstacles

Enjoy playing!

