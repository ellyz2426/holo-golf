/**
 * Holo Golf VR — Course 2: Quantum Field
 * Advanced 9-hole course with teleporters, wind zones, and tighter layouts.
 */
import { Vector3 } from "@iwsdk/core";
import type { CourseData } from "./course";

export const QUANTUM_FIELD_COURSE: CourseData = {
  name: "Quantum Field",
  description: "Advanced holographic course — brace for quantum anomalies",
  themeColor: 0xff44aa,
  holes: [
    // Hole 1: "Phase Shift" — Gentle intro with one bumper
    {
      index: 0,
      name: "Phase Shift",
      par: 2,
      teePosition: new Vector3(0, 0, 2),
      holePosition: new Vector3(0, 0, -2.5),
      surfaces: [
        { position: new Vector3(0, -0.025, 0), size: [0.7, 0.05, 5.5], color: 0x440066 },
      ],
      walls: [
        { position: new Vector3(-0.37, 0.05, 0), size: [0.04, 0.15, 5.5], color: 0x8822aa },
        { position: new Vector3(0.37, 0.05, 0), size: [0.04, 0.15, 5.5], color: 0x8822aa },
      ],
      obstacles: [
        { type: "bumper", position: new Vector3(0, 0, 0), params: { radius: 0.1 } },
      ],
      decorations: [
        { type: "pillar", position: new Vector3(-0.55, 0, 2), params: { height: 0.7 } },
        { type: "pillar", position: new Vector3(0.55, 0, 2), params: { height: 0.7 } },
        { type: "arrow", position: new Vector3(0, 0, 1), params: { rotation: Math.PI } },
      ],
    },

    // Hole 2: "Zigzag" — Tight zigzag corridor
    {
      index: 1,
      name: "Zigzag",
      par: 3,
      teePosition: new Vector3(-0.5, 0, 2),
      holePosition: new Vector3(0.5, 0, -2),
      surfaces: [
        { position: new Vector3(-0.5, -0.025, 1.5), size: [0.5, 0.05, 1.5], color: 0x440066 },
        { position: new Vector3(0, -0.025, 0.5), size: [1.5, 0.05, 0.5], color: 0x440066 },
        { position: new Vector3(0.5, -0.025, -0.3), size: [0.5, 0.05, 1.1], color: 0x440066 },
        { position: new Vector3(0, -0.025, -1.1), size: [1.5, 0.05, 0.5], color: 0x440066 },
        { position: new Vector3(-0.5, -0.025, -1.6), size: [0.5, 0.05, 0.5], color: 0x440066 },
        { position: new Vector3(0, -0.025, -1.85), size: [1.5, 0.05, 0.5], color: 0x440066 },
        { position: new Vector3(0.5, -0.025, -2), size: [0.5, 0.05, 0.5], color: 0x440066 },
      ],
      walls: [
        { position: new Vector3(-0.77, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0x8822aa },
        { position: new Vector3(-0.23, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0x8822aa },
        { position: new Vector3(0.77, 0.05, -0.3), size: [0.04, 0.15, 1.1], color: 0x8822aa },
        { position: new Vector3(0.23, 0.05, -0.3), size: [0.04, 0.15, 1.1], color: 0x8822aa },
      ],
      obstacles: [],
      decorations: [
        { type: "orb", position: new Vector3(-0.5, 0.4, 2), params: { color: 0xff44aa } },
        { type: "orb", position: new Vector3(0.5, 0.4, -2), params: { color: 0xff44aa } },
      ],
    },

    // Hole 3: "Double Windmill" — Two windmills in sequence
    {
      index: 2,
      name: "Double Windmill",
      par: 4,
      teePosition: new Vector3(0, 0, 3),
      holePosition: new Vector3(0, 0, -3),
      surfaces: [
        { position: new Vector3(0, -0.025, 0), size: [0.7, 0.05, 7], color: 0x440066 },
      ],
      walls: [
        { position: new Vector3(-0.37, 0.05, 0), size: [0.04, 0.15, 7], color: 0x8822aa },
        { position: new Vector3(0.37, 0.05, 0), size: [0.04, 0.15, 7], color: 0x8822aa },
      ],
      obstacles: [
        { type: "windmill", position: new Vector3(0, 0, 1), params: { length: 0.6, speed: 2.5 } },
        { type: "windmill", position: new Vector3(0, 0, -1), params: { length: 0.6, speed: -2.0 } },
      ],
      decorations: [
        { type: "ring", position: new Vector3(0, 0.4, 1), params: { radius: 0.25, color: 0xff2266 } },
        { type: "ring", position: new Vector3(0, 0.4, -1), params: { radius: 0.25, color: 0xff2266 } },
      ],
    },

    // Hole 4: "The Chasm" — Gap crossing with ramp launch
    {
      index: 3,
      name: "The Chasm",
      par: 3,
      teePosition: new Vector3(0, 0, 2),
      holePosition: new Vector3(0, 0, -2.5),
      surfaces: [
        { position: new Vector3(0, -0.025, 1.5), size: [0.7, 0.05, 1.5], color: 0x440066 },
        { position: new Vector3(0, -0.025, -2), size: [0.7, 0.05, 1.5], color: 0x440066 },
      ],
      walls: [
        { position: new Vector3(-0.37, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0x8822aa },
        { position: new Vector3(0.37, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0x8822aa },
        { position: new Vector3(-0.37, 0.05, -2), size: [0.04, 0.15, 1.5], color: 0x8822aa },
        { position: new Vector3(0.37, 0.05, -2), size: [0.04, 0.15, 1.5], color: 0x8822aa },
      ],
      obstacles: [
        { type: "ramp", position: new Vector3(0, 0.05, 0.8), params: { width: 0.5, depth: 0.4, angle: 0.35 } },
      ],
      specialObstacles: [
        { type: "water_hazard", position: new Vector3(0, -0.05, -0.15), params: { size: new Vector3(0.8, 0.01, 1.2), color: 0x3322aa } },
      ],
      decorations: [
        { type: "ring", position: new Vector3(0, -0.3, 0), params: { radius: 0.4, color: 0x660044 } },
        { type: "pillar", position: new Vector3(-0.5, 0, 2), params: { height: 0.6 } },
        { type: "pillar", position: new Vector3(0.5, 0, 2), params: { height: 0.6 } },
      ],
    },

    // Hole 5: "Bumper Maze" — Dense bumper field
    {
      index: 4,
      name: "Bumper Maze",
      par: 4,
      teePosition: new Vector3(0, 0, 2.5),
      holePosition: new Vector3(0, 0, -2.5),
      surfaces: [
        { position: new Vector3(0, -0.025, 0), size: [1.4, 0.05, 6], color: 0x440066 },
      ],
      walls: [
        { position: new Vector3(-0.72, 0.05, 0), size: [0.04, 0.15, 6], color: 0x8822aa },
        { position: new Vector3(0.72, 0.05, 0), size: [0.04, 0.15, 6], color: 0x8822aa },
      ],
      obstacles: [
        { type: "bumper", position: new Vector3(-0.3, 0, 1.5), params: { radius: 0.1 } },
        { type: "bumper", position: new Vector3(0.3, 0, 1.0), params: { radius: 0.1 } },
        { type: "bumper", position: new Vector3(0, 0, 0.3), params: { radius: 0.12 } },
        { type: "bumper", position: new Vector3(-0.35, 0, -0.5), params: { radius: 0.08 } },
        { type: "bumper", position: new Vector3(0.35, 0, -0.5), params: { radius: 0.08 } },
        { type: "bumper", position: new Vector3(0, 0, -1.3), params: { radius: 0.1 } },
        { type: "bumper", position: new Vector3(-0.25, 0, -2.0), params: { radius: 0.08 } },
        { type: "bumper", position: new Vector3(0.25, 0, -2.0), params: { radius: 0.08 } },
      ],
      decorations: [],
    },

    // Hole 6: "Spinner Gauntlet" — Two spinners + bumpers
    {
      index: 5,
      name: "Spinner Gauntlet",
      par: 4,
      teePosition: new Vector3(0, 0, 3),
      holePosition: new Vector3(0, 0, -3),
      surfaces: [
        { position: new Vector3(0, -0.025, 0), size: [0.9, 0.05, 7], color: 0x440066 },
      ],
      walls: [
        { position: new Vector3(-0.47, 0.05, 0), size: [0.04, 0.15, 7], color: 0x8822aa },
        { position: new Vector3(0.47, 0.05, 0), size: [0.04, 0.15, 7], color: 0x8822aa },
      ],
      obstacles: [
        { type: "spinner", position: new Vector3(0, 0, 1.5), params: { radius: 0.35, speed: 2.0 } },
        { type: "bumper", position: new Vector3(-0.2, 0, 0), params: { radius: 0.08 } },
        { type: "bumper", position: new Vector3(0.2, 0, 0), params: { radius: 0.08 } },
        { type: "spinner", position: new Vector3(0, 0, -1.5), params: { radius: 0.35, speed: -2.5 } },
      ],
      decorations: [
        { type: "ring", position: new Vector3(0, 0.5, 1.5), params: { radius: 0.2, color: 0x44ff88 } },
        { type: "ring", position: new Vector3(0, 0.5, -1.5), params: { radius: 0.2, color: 0x44ff88 } },
      ],
    },

    // Hole 7: "The Fortress" — Walls form a mini fortress around the hole
    {
      index: 6,
      name: "The Fortress",
      par: 4,
      teePosition: new Vector3(0, 0, 3),
      holePosition: new Vector3(0, 0, -1),
      surfaces: [
        { position: new Vector3(0, -0.025, 1), size: [1.0, 0.05, 5], color: 0x440066 },
      ],
      walls: [
        { position: new Vector3(-0.52, 0.05, 1), size: [0.04, 0.15, 5], color: 0x8822aa },
        { position: new Vector3(0.52, 0.05, 1), size: [0.04, 0.15, 5], color: 0x8822aa },
        // Fortress walls around hole
        { position: new Vector3(-0.25, 0.05, -1.5), size: [0.04, 0.15, 0.6], color: 0xff4488 },
        { position: new Vector3(0.25, 0.05, -1.5), size: [0.04, 0.15, 0.6], color: 0xff4488 },
        { position: new Vector3(0, 0.05, -1.82), size: [0.5, 0.15, 0.04], color: 0xff4488 },
        // Gap in front wall for ball entry
      ],
      obstacles: [
        { type: "windmill", position: new Vector3(0, 0, 0.5), params: { length: 0.5, speed: 1.8 } },
      ],
      decorations: [
        { type: "pillar", position: new Vector3(-0.3, 0, -1.9), params: { height: 0.4 } },
        { type: "pillar", position: new Vector3(0.3, 0, -1.9), params: { height: 0.4 } },
      ],
    },

    // Hole 8: "Cascade" — Multi-level descent
    {
      index: 7,
      name: "Cascade",
      par: 4,
      teePosition: new Vector3(0, 0.4, 3),
      holePosition: new Vector3(0, 0, -3),
      surfaces: [
        { position: new Vector3(0, 0.375, 2.5), size: [0.7, 0.05, 1.5], color: 0x440066 },
        { position: new Vector3(0, 0.2, 1.2), size: [0.7, 0.05, 0.8], color: 0x440066, slope: { axis: "z", angle: -0.2 } },
        { position: new Vector3(0, 0.175, 0), size: [0.7, 0.05, 1.5], color: 0x440066 },
        { position: new Vector3(0, 0.05, -1.2), size: [0.7, 0.05, 0.8], color: 0x440066, slope: { axis: "z", angle: -0.2 } },
        { position: new Vector3(0, -0.025, -2.5), size: [0.7, 0.05, 1.5], color: 0x440066 },
      ],
      walls: [
        { position: new Vector3(-0.37, 0.2, 0), size: [0.04, 0.5, 7], color: 0x8822aa },
        { position: new Vector3(0.37, 0.2, 0), size: [0.04, 0.5, 7], color: 0x8822aa },
      ],
      obstacles: [
        { type: "bumper", position: new Vector3(0, 0.175, 0), params: { radius: 0.1 } },
      ],
      decorations: [
        { type: "ring", position: new Vector3(0, 0.8, 3), params: { radius: 0.3, color: 0xffaa00 } },
      ],
    },

    // Hole 9: "Quantum Nexus" — The ultimate challenge with gravity well
    {
      index: 8,
      name: "Quantum Nexus",
      par: 5,
      teePosition: new Vector3(0, 0, 4),
      holePosition: new Vector3(0, 0.3, -4),
      surfaces: [
        { position: new Vector3(0, -0.025, 3), size: [0.8, 0.05, 2.5], color: 0x440066 },
        { position: new Vector3(0, -0.025, 0.5), size: [1.2, 0.05, 2.5], color: 0x440066 },
        { position: new Vector3(0, -0.025, -1.5), size: [0.8, 0.05, 1.5], color: 0x440066 },
        { position: new Vector3(0, 0.15, -3), size: [0.8, 0.05, 1], color: 0x440066, slope: { axis: "z", angle: -0.2 } },
        { position: new Vector3(0, 0.275, -4), size: [0.8, 0.05, 1.5], color: 0x440066 },
      ],
      walls: [
        { position: new Vector3(-0.42, 0.15, 0), size: [0.04, 0.35, 9.5], color: 0x8822aa },
        { position: new Vector3(0.42, 0.15, 0), size: [0.04, 0.35, 9.5], color: 0x8822aa },
      ],
      obstacles: [
        { type: "windmill", position: new Vector3(0, 0, 2), params: { length: 0.6, speed: 2.0 } },
        { type: "bumper", position: new Vector3(-0.3, 0, 0.5), params: { radius: 0.1 } },
        { type: "bumper", position: new Vector3(0.3, 0, 0.5), params: { radius: 0.1 } },
        { type: "spinner", position: new Vector3(0, 0, -1), params: { radius: 0.3, speed: 2.5 } },
        { type: "moving_wall", position: new Vector3(0, 0.3, -2), params: { width: 0.4, height: 0.12, range: 0.3, speed: 1.5, axis: "x" } },
      ],
      decorations: [
        { type: "pillar", position: new Vector3(-0.6, 0, 4.5), params: { height: 1.5 } },
        { type: "pillar", position: new Vector3(0.6, 0, 4.5), params: { height: 1.5 } },
        { type: "ring", position: new Vector3(0, 1.0, -4), params: { radius: 0.4, color: 0xff44aa } },
        { type: "orb", position: new Vector3(0, 1.5, -4), params: { radius: 0.1, color: 0xff44aa } },
        { type: "ring", position: new Vector3(0, 0.6, 2), params: { radius: 0.2, color: 0xff2266 } },
      ],
      specialObstacles: [
        {
          type: "gravity_well",
          position: new Vector3(0, 0, -0.5),
          params: { radius: 0.5, strength: 2.5, color: 0xaa44ff },
        },
        {
          type: "speed_boost",
          position: new Vector3(0, 0.15, -3),
          params: {
            direction: new Vector3(0, 0, -1),
            boostForce: 3.0,
            size: new Vector3(0.25, 0.01, 0.35),
            color: 0xff44aa,
          },
        },
      ],
    },
  ],
};
