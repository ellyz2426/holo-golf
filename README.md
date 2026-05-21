# Holo Golf VR 🏌️‍♂️

**Futuristic holographic mini golf in VR** — 9 holes of neon wireframe courses suspended in holodeck space.

Built with [IWSDK](https://iwsdk.dev) (Immersive Web SDK) 0.4.1.

## Play

**Live:** [https://ellyz2426.github.io/holo-golf/](https://ellyz2426.github.io/holo-golf/)

### Browser Controls
- **Left click + drag** back from ball to aim and set power
- **Release** to putt
- **Right click + drag** to orbit camera
- **Scroll** to zoom
- **R** to reset ball to tee
- **ESC** to return to menu

### VR Controls
- **Swing right controller** near ball to putt (speed = power)
- **A button** for menu navigation
- **B button** to reset ball

## Features

- 🌐 9 unique holes with progressive difficulty
- 🎯 Windmills, bumpers, moving walls, ramps, and spinners
- 🎨 Neon wireframe holodeck aesthetic with starfield
- 🔊 Procedural audio (Web Audio API)
- 🎮 Dual runtime: VR + browser-first
- 📊 Scorecard with par tracking, hole-in-one detection
- 💾 Best score persistence (localStorage)
- ✨ Particle effects for hole completion

## Tech Stack

- IWSDK 0.4.1 + Three.js (super-three)
- Vite 7
- TypeScript
- Web Audio API (procedural)
