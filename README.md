# 🏌️ Holo Golf VR

A futuristic holodeck-style mini golf game built with IWSDK (Immersive Web SDK). Play in VR with full controller support or in your browser with mouse/keyboard.

🎮 **[Play Now →](https://ellyz2426.github.io/holo-golf/)**

## Features

### 🎯 27 Holes Across 3 Themed Courses

- **Neon Circuit** (Easy–Medium) — Clean cyan/green wireframe aesthetic, gentle slopes, classic obstacles
- **Quantum Field** (Medium–Hard) — Purple/pink palette, complex layouts, spinner obstacles, tight corridors
- **Cosmic Abyss** (Expert) — Orange/red ominous atmosphere with teleporter warps, wind zones, and ice surfaces

### 🕹️ Full VR Controller Support

Every game state responds to XR controllers:

| Button | Action |
|--------|--------|
| **Trigger** | Putt / Select menu item |
| **A Button** | Reset ball / Skip to next hole |
| **B Button** | Pause game / Go back in menus |
| **Grip** | Power boost while held |
| **Left Stick** | Orbit camera around ball |
| **Right Stick** | Navigate menu items |

Plus swing-to-putt: physically swing the controller near the ball to hit it.

### 🖱️ Browser Controls

- **Click & drag** from ball to aim and set power (release to putt)
- **Right-drag** to orbit camera
- **Scroll** to zoom
- **R** to reset ball
- **TAB** for scorecard
- **L** for leaderboard
- **ESC** to pause / resume
- **Space/Enter** to skip to next hole

### 🎨 Course-Specific Theming

Each course has unique:
- Fog color and density
- Grid floor color
- Starfield palette (cyan stars, purple stars, orange stars)
- Ambient floating holographic shapes (boxes, spheres, tori, cones)
- Floating ambient particles (40 per course, theme-matched colors)
- Point lighting accents
- Background music (distinct synthesizer drone per course)
- Particle effect palettes
- Ball trail color gradients

### 👻 Ghost Ball Replay System

- Records your ball positions at ~30fps during every hole
- Saves best run per hole to localStorage
- Replays your best run as a translucent gold ghost ball with trail
- Compare your current play against your personal best in real-time

### 🎱 Unlockable Ball Skins

7 ball appearances earned through gameplay achievements:

| Skin | Unlock Condition |
|------|-----------------|
| 🔵 Cyan Standard | Always available |
| ☀️ Solar Flare | Complete any course |
| 💜 Amethyst Pulse | Score 3 hole-in-ones |
| 💚 Emerald Wisp | Complete 5 rounds |
| ❤️ Ruby Blaze | Complete all 3 courses |
| 🏆 Golden Champion | Finish a course under par |
| 🌈 Prismatic | Get a 5+ under-par streak |

Select your ball skin from the Settings menu.

### 💨 Wind Indicator

Visual 3D overlay appears above the ball when near wind zones:
- Animated directional arrow with cone head
- Concentric pulsing rings
- Streaming particles flowing in wind direction
- Intensity scales with wind force

### 📊 Mini Scorecard

Always-visible compact scorecard during play:
- Course name and current hole/par
- Stroke count with vs-par indicator
- Color-coded hole-by-hole progress dots (green=under par, white=par, red=over par)
- Running total score

### 🏋️ Practice Mode

Select any hole from any course to practice individually. Best practice scores are saved separately from course scores.

### 🏆 Leaderboard

- **Personal best scores** per course with timestamps
- **Top 10** tracked per course
- **Medal indicators** (🥇🥈🥉) for top scores
- **New record toasts** when you beat your personal best
- Accessible from title screen or with `L` key

### ⏸️ Pause Menu

Pause mid-round (ESC or B button in VR) with:
- Current stroke count and course total
- Resume or quit to menu
- Full XR controller navigation

### 📊 Gameplay

- **10-stroke limit** per hole (HUD turns red as you approach)
- **5 obstacle types**: walls, ramps, bumpers, windmills, spinners
- **6 special mechanics**: teleporter warps, wind zones, ice surfaces, water hazards, gravity wells, speed boost pads
- **Ball out-of-bounds** detection with penalty stroke + tee reset
- **Ball shadow** for depth perception (scales with height)
- **Camera shake** on wall bounces, bumper hits, OOB, water, hole-in-one
- **Slow-motion** when ball approaches hole cup
- **Streak/combo system** tracks consecutive under-par holes with escalating chimes
- **Scoring**: Hole-in-one, Albatross, Eagle, Birdie, Par, Bogey, etc.
- **12 achievements** with persistent tracking
- **Statistics**: rounds played, holes completed, scoring breakdown
- **Best scores** per course saved to localStorage

### 🗺️ Mini-Map

Real-time overhead mini-map shows:
- Hole layout with surfaces and walls
- Ball position (cyan dot with glow)
- Tee marker (green, pulsing)
- Hole/cup marker (pulsing yellow beacon)
- Obstacle positions

### 🔊 Procedural Audio

All audio is generated in real-time via Web Audio API (25+ distinct SFX):
- Course-specific ambient drone (synth pad with LFO modulation)
- Rolling ball procedural sound (speed-reactive pitch and volume)
- Distinct score SFX: eagle (arpeggio + sparkle), birdie (chirpy), par (confirm), bogey (descending)
- Putt, swing, bounce, wall-bounce, bumper-hit SFX
- Teleporter ascending/descending arpeggio
- Gravity well eerie warping tone
- Speed boost ascending whoosh
- Streak chime (escalating based on streak length)
- Hole-in-one fanfare with sparkle cascade
- Water splash (filtered noise + bubbling tones)
- OOB alert (descending square wave)
- Menu hover and select tones
- Stroke limit descending "wah-wah"
- Master / Music / SFX volume sliders in Settings

### ✨ Visual Effects

- Course-themed ball trail with color gradient (object-pooled)
- Ball spin animation (velocity-proportional)
- Enhanced ball glow (speed-reactive intensity + color shift)
- Ball shadow (scales with ball height)
- Holodeck scanline/CRT overlay with vignette
- Floating ambient particles per course theme
- Particle bursts on hole completion
- Expanding rings and light columns for hole-in-one
- Pulsing celebration orbs
- Teleport purple particle spirals
- Water hazard splash effect (blue particle burst)
- Animated tee marker (pulsing glow)
- Animated hole cup beacon (pulsing beam + rim)
- Toast notifications for OOB, water hazard, hole-in-one, new records, streaks
- HUD penalty flash on OOB/water hazard
- Course-themed particle palettes

## Tech Stack

- **[IWSDK](https://iwsdk.dev)** (Immersive Web SDK) v0.4.1 — WebXR framework
- **Three.js** (via @iwsdk/core) — 3D rendering
- **TypeScript** — Type-safe game code
- **Vite** — Build tooling
- **Web Audio API** — Procedural audio synthesis

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
PROJECT="$PWD"
cd /tmp && rm -rf gh-pages-deploy && mkdir gh-pages-deploy && cd gh-pages-deploy
git init && cp -R "$PROJECT/dist/." .
git add -A && git commit -m "Deploy"
git push --force "https://github.com/ellyz2426/holo-golf.git" HEAD:gh-pages
```

## Project Structure

```
src/
├── index.ts            # Entry point, wires all systems
├── game.ts             # Central state machine + scoring
├── ball.ts             # Ball physics, trails, shadow, skins, zone effects
├── putter.ts           # Putter controller (XR swing + browser aim)
├── course.ts           # Course 1 data + geometry builder
├── course2.ts          # Course 2: Quantum Field
├── course3.ts          # Course 3: Cosmic Abyss
├── xrinput.ts          # Full XR controller handler
├── browserinput.ts     # Mouse/keyboard handler
├── ui.ts               # HTML overlay menus + settings + skins
├── hud.ts              # Canvas-based in-world HUD
├── environment.ts      # Holodeck environment + course theming + particles
├── effects.ts          # Particle effects + celebrations
├── audio.ts            # Procedural audio synthesis (25+ SFX)
├── ghost.ts            # Ghost ball replay system
├── windindicator.ts    # Wind direction visual indicator
├── ballskins.ts        # Unlockable ball skin system
├── miniscore.ts        # Mini scorecard overlay
├── holepreview.ts      # Hole preview camera flythrough
├── minimap.ts          # Overhead hole mini-map
├── practice.ts         # Practice mode (single-hole replay)
├── scorecard.ts        # Detailed scorecard overlay
├── powermeter.ts       # Aim power indicator
├── postfx.ts           # Scanlines, camera shake, slow-mo, streaks
├── banner.ts           # Animated hole intro banners
├── achievements.ts     # 12 achievements with persistence
├── stats.ts            # Play statistics tracking
├── controls.ts         # Controls help overlay
├── loading.ts          # Loading screen
├── leaderboard.ts      # Personal best leaderboard system
├── toast.ts            # Toast notification system
├── waterhazard.ts      # Water hazard obstacle type
├── gravitywell.ts      # Gravity well obstacle type
└── specialobstacles.ts # Teleporters, wind zones, ice
```

## License

MIT
