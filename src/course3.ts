/**
 * Holo Golf VR — Course 3: Cosmic Abyss
 * Expert 9-hole course featuring teleporters, wind zones, ice surfaces,
 * and tighter, more creative layouts. Deep purple/red/gold theme.
 */
import { Vector3 } from "@iwsdk/core";
import type { CourseData } from "./course";

export const COSMIC_ABYSS_COURSE: CourseData = {
  name: "Cosmic Abyss",
  description: "Expert course — warp through space, defy gravity, survive the void",
  themeColor: 0xff6600,
  holes: [
    // Hole 1: "Warp Gate" — Teleporter tutorial
    {
      index: 0,
      name: "Warp Gate",
      par: 2,
      teePosition: new Vector3(0, 0, 2),
      holePosition: new Vector3(2, 0, 0),
      surfaces: [
        { position: new Vector3(0, -0.025, 1.5), size: [0.6, 0.05, 1.5], color: 0x331100 },
        { position: new Vector3(0, -0.025, -0.5), size: [0.6, 0.05, 1.5], color: 0x331100 },
        { position: new Vector3(1, -0.025, -0.5), size: [1.5, 0.05, 0.6], color: 0x331100 },
        { position: new Vector3(2, -0.025, 0), size: [0.6, 0.05, 1.5], color: 0x331100 },
      ],
      walls: [
        { position: new Vector3(-0.32, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
        { position: new Vector3(0.32, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
        { position: new Vector3(2.32, 0.05, 0), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
        { position: new Vector3(1.68, 0.05, 0), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
      ],
      obstacles: [],
      decorations: [
        { type: "pillar", position: new Vector3(-0.5, 0, 2.5), params: { height: 0.6 } },
        { type: "pillar", position: new Vector3(0.5, 0, 2.5), params: { height: 0.6 } },
        { type: "ring", position: new Vector3(0, 0.3, 0.3), params: { radius: 0.2, color: 0x8844ff } },
      ],
      specialObstacles: [
        {
          type: "teleporter",
          position: new Vector3(0, 0, 0.3),
          params: { target: new Vector3(2, 0.05, -0.5), color: 0x8844ff },
        },
      ],
    },

    // Hole 2: "Wind Tunnel" — Strong headwind on approach
    {
      index: 1,
      name: "Wind Tunnel",
      par: 3,
      teePosition: new Vector3(0, 0, 3),
      holePosition: new Vector3(0, 0, -3),
      surfaces: [
        { position: new Vector3(0, -0.025, 0), size: [0.7, 0.05, 7], color: 0x331100 },
      ],
      walls: [
        { position: new Vector3(-0.37, 0.05, 0), size: [0.04, 0.15, 7], color: 0xcc6600 },
        { position: new Vector3(0.37, 0.05, 0), size: [0.04, 0.15, 7], color: 0xcc6600 },
      ],
      obstacles: [
        { type: "bumper", position: new Vector3(0, 0, 0.5), params: { radius: 0.08 } },
      ],
      decorations: [
        { type: "arrow", position: new Vector3(0, 0, 1.5), params: { rotation: Math.PI } },
        { type: "arrow", position: new Vector3(0, 0, 0), params: { rotation: Math.PI } },
      ],
      specialObstacles: [
        {
          type: "wind_zone",
          position: new Vector3(0, 0, -1.5),
          params: {
            direction: new Vector3(0, 0, 1),
            force: 3,
            size: new Vector3(0.7, 0.5, 3),
          },
        },
      ],
    },

    // Hole 3: "Frozen Path" — Ice surface reduces friction
    {
      index: 2,
      name: "Frozen Path",
      par: 3,
      teePosition: new Vector3(0, 0, 2.5),
      holePosition: new Vector3(0, 0, -2.5),
      surfaces: [
        { position: new Vector3(0, -0.025, 0), size: [0.7, 0.05, 6], color: 0x331100 },
      ],
      walls: [
        { position: new Vector3(-0.37, 0.05, 0), size: [0.04, 0.15, 6], color: 0xcc6600 },
        { position: new Vector3(0.37, 0.05, 0), size: [0.04, 0.15, 6], color: 0xcc6600 },
      ],
      obstacles: [],
      decorations: [
        { type: "orb", position: new Vector3(0, 0.4, 0), params: { radius: 0.08, color: 0x88ccff } },
      ],
      specialObstacles: [
        {
          type: "ice_surface",
          position: new Vector3(0, 0, 0),
          params: { size: new Vector3(0.7, 0.01, 3) },
        },
      ],
    },

    // Hole 4: "Double Warp" — Two teleporters create a shortcut or trap
    {
      index: 3,
      name: "Double Warp",
      par: 3,
      teePosition: new Vector3(-1, 0, 2),
      holePosition: new Vector3(1, 0, -2),
      surfaces: [
        { position: new Vector3(-1, -0.025, 1.5), size: [0.6, 0.05, 1.5], color: 0x331100 },
        { position: new Vector3(0, -0.025, 0.5), size: [2.6, 0.05, 0.6], color: 0x331100 },
        { position: new Vector3(1, -0.025, -0.5), size: [0.6, 0.05, 1.5], color: 0x331100 },
        { position: new Vector3(0, -0.025, -1.5), size: [2.6, 0.05, 0.6], color: 0x331100 },
        { position: new Vector3(1, -0.025, -2), size: [0.6, 0.05, 0.6], color: 0x331100 },
      ],
      walls: [
        { position: new Vector3(-1.32, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
        { position: new Vector3(-0.68, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
        { position: new Vector3(1.32, 0.05, -1), size: [0.04, 0.15, 2.5], color: 0xcc6600 },
        { position: new Vector3(0.68, 0.05, -1), size: [0.04, 0.15, 2.5], color: 0xcc6600 },
      ],
      obstacles: [],
      decorations: [
        { type: "ring", position: new Vector3(-1, 0.3, 0.3), params: { radius: 0.2, color: 0xff4488 } },
        { type: "ring", position: new Vector3(1, 0.3, -0.5), params: { radius: 0.2, color: 0x44ff88 } },
      ],
      specialObstacles: [
        {
          type: "teleporter",
          position: new Vector3(-1, 0, 0.3),
          params: { target: new Vector3(1, 0.05, 0.5), color: 0xff4488 },
        },
        {
          type: "teleporter",
          position: new Vector3(1, 0, -0.5),
          params: { target: new Vector3(1, 0.05, -1.8), color: 0x44ff88 },
        },
      ],
    },

    // Hole 5: "Storm Alley" — Crosswind + bumpers
    {
      index: 4,
      name: "Storm Alley",
      par: 4,
      teePosition: new Vector3(0, 0, 3),
      holePosition: new Vector3(0, 0, -3),
      surfaces: [
        { position: new Vector3(0, -0.025, 0), size: [1.0, 0.05, 7], color: 0x331100 },
      ],
      walls: [
        { position: new Vector3(-0.52, 0.05, 0), size: [0.04, 0.15, 7], color: 0xcc6600 },
        { position: new Vector3(0.52, 0.05, 0), size: [0.04, 0.15, 7], color: 0xcc6600 },
      ],
      obstacles: [
        { type: "bumper", position: new Vector3(-0.2, 0, 1), params: { radius: 0.1 } },
        { type: "bumper", position: new Vector3(0.2, 0, -0.5), params: { radius: 0.1 } },
        { type: "bumper", position: new Vector3(-0.15, 0, -2), params: { radius: 0.08 } },
      ],
      decorations: [
        { type: "pillar", position: new Vector3(-0.7, 0, 3.5), params: { height: 1.0 } },
        { type: "pillar", position: new Vector3(0.7, 0, 3.5), params: { height: 1.0 } },
      ],
      specialObstacles: [
        {
          type: "wind_zone",
          position: new Vector3(0, 0, 0),
          params: {
            direction: new Vector3(1, 0, 0),
            force: 2.5,
            size: new Vector3(1, 0.5, 7),
          },
        },
      ],
    },

    // Hole 6: "Black Ice" — Ice + ramps + tight turns
    {
      index: 5,
      name: "Black Ice",
      par: 4,
      teePosition: new Vector3(0, 0, 2.5),
      holePosition: new Vector3(0, 0, -3),
      surfaces: [
        { position: new Vector3(0, -0.025, 1.5), size: [0.7, 0.05, 2.5], color: 0x331100 },
        { position: new Vector3(0, -0.025, -1), size: [0.7, 0.05, 2.5], color: 0x331100 },
        { position: new Vector3(0, -0.025, -3), size: [0.7, 0.05, 1.5], color: 0x331100 },
      ],
      walls: [
        { position: new Vector3(-0.37, 0.05, 0), size: [0.04, 0.15, 7.5], color: 0xcc6600 },
        { position: new Vector3(0.37, 0.05, 0), size: [0.04, 0.15, 7.5], color: 0xcc6600 },
      ],
      obstacles: [
        { type: "windmill", position: new Vector3(0, 0, -2), params: { length: 0.5, speed: 2.0 } },
      ],
      decorations: [
        { type: "orb", position: new Vector3(0, 0.4, 0), params: { radius: 0.06, color: 0x88ccff } },
      ],
      specialObstacles: [
        {
          type: "ice_surface",
          position: new Vector3(0, 0, 0.5),
          params: { size: new Vector3(0.7, 0.01, 2) },
        },
        {
          type: "ice_surface",
          position: new Vector3(0, 0, -1.5),
          params: { size: new Vector3(0.7, 0.01, 1.5) },
        },
      ],
    },

    // Hole 7: "Portal Maze" — Multiple teleporters and obstacles
    {
      index: 6,
      name: "Portal Maze",
      par: 4,
      teePosition: new Vector3(-1.5, 0, 2),
      holePosition: new Vector3(1.5, 0, -2),
      surfaces: [
        { position: new Vector3(-1.5, -0.025, 1.5), size: [0.6, 0.05, 1.5], color: 0x331100 },
        { position: new Vector3(0, -0.025, 0.5), size: [3.6, 0.05, 0.6], color: 0x331100 },
        { position: new Vector3(0, -0.025, -0.5), size: [3.6, 0.05, 0.6], color: 0x331100 },
        { position: new Vector3(1.5, -0.025, -1.5), size: [0.6, 0.05, 1.5], color: 0x331100 },
      ],
      walls: [
        { position: new Vector3(-1.82, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
        { position: new Vector3(-1.18, 0.05, 1.5), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
        { position: new Vector3(1.82, 0.05, -1.5), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
        { position: new Vector3(1.18, 0.05, -1.5), size: [0.04, 0.15, 1.5], color: 0xcc6600 },
      ],
      obstacles: [
        { type: "bumper", position: new Vector3(0, 0, 0.5), params: { radius: 0.08 } },
        { type: "bumper", position: new Vector3(0, 0, -0.5), params: { radius: 0.08 } },
      ],
      decorations: [
        { type: "ring", position: new Vector3(-1.5, 0.3, 0.5), params: { radius: 0.15, color: 0x8844ff } },
        { type: "ring", position: new Vector3(0.5, 0.3, -0.5), params: { radius: 0.15, color: 0xff8844 } },
      ],
      specialObstacles: [
        {
          type: "teleporter",
          position: new Vector3(-1.5, 0, 0.5),
          params: { target: new Vector3(0.5, 0.05, 0.5), color: 0x8844ff },
        },
        {
          type: "teleporter",
          position: new Vector3(0.5, 0, -0.5),
          params: { target: new Vector3(1.5, 0.05, -1), color: 0xff8844 },
        },
      ],
    },

    // Hole 8: "Tempest" — Wind + ice + bumpers gauntlet
    {
      index: 7,
      name: "Tempest",
      par: 5,
      teePosition: new Vector3(0, 0, 3.5),
      holePosition: new Vector3(0, 0, -3.5),
      surfaces: [
        { position: new Vector3(0, -0.025, 0), size: [0.9, 0.05, 8], color: 0x331100 },
      ],
      walls: [
        { position: new Vector3(-0.47, 0.05, 0), size: [0.04, 0.15, 8], color: 0xcc6600 },
        { position: new Vector3(0.47, 0.05, 0), size: [0.04, 0.15, 8], color: 0xcc6600 },
      ],
      obstacles: [
        { type: "bumper", position: new Vector3(-0.2, 0, 2), params: { radius: 0.1 } },
        { type: "bumper", position: new Vector3(0.2, 0, 1), params: { radius: 0.08 } },
        { type: "windmill", position: new Vector3(0, 0, -0.5), params: { length: 0.6, speed: 2.0 } },
        { type: "bumper", position: new Vector3(-0.15, 0, -2.5), params: { radius: 0.1 } },
        { type: "bumper", position: new Vector3(0.2, 0, -2.5), params: { radius: 0.08 } },
      ],
      decorations: [
        { type: "pillar", position: new Vector3(-0.65, 0, 4), params: { height: 1.2 } },
        { type: "pillar", position: new Vector3(0.65, 0, 4), params: { height: 1.2 } },
      ],
      specialObstacles: [
        {
          type: "ice_surface",
          position: new Vector3(0, 0, 1.5),
          params: { size: new Vector3(0.9, 0.01, 2) },
        },
        {
          type: "wind_zone",
          position: new Vector3(0, 0, -1.5),
          params: {
            direction: new Vector3(-1, 0, 0.5).normalize(),
            force: 2,
            size: new Vector3(0.9, 0.5, 2),
          },
        },
      ],
    },

    // Hole 9: "Event Horizon" — The ultimate challenge
    {
      index: 8,
      name: "Event Horizon",
      par: 5,
      teePosition: new Vector3(0, 0, 4),
      holePosition: new Vector3(0, 0.3, -4),
      surfaces: [
        { position: new Vector3(0, -0.025, 3), size: [0.8, 0.05, 2.5], color: 0x331100 },
        { position: new Vector3(0, -0.025, 0.5), size: [1.2, 0.05, 2], color: 0x331100 },
        { position: new Vector3(0, -0.025, -1.5), size: [0.8, 0.05, 2], color: 0x331100 },
        { position: new Vector3(0, 0.15, -3), size: [0.8, 0.05, 1], color: 0x331100, slope: { axis: "z", angle: -0.2 } },
        { position: new Vector3(0, 0.275, -4), size: [0.8, 0.05, 1.5], color: 0x331100 },
      ],
      walls: [
        { position: new Vector3(-0.42, 0.15, 0), size: [0.04, 0.35, 9.5], color: 0xcc6600 },
        { position: new Vector3(0.42, 0.15, 0), size: [0.04, 0.35, 9.5], color: 0xcc6600 },
      ],
      obstacles: [
        { type: "windmill", position: new Vector3(0, 0, 2), params: { length: 0.6, speed: 2.5 } },
        { type: "bumper", position: new Vector3(-0.3, 0, 0.5), params: { radius: 0.1 } },
        { type: "bumper", position: new Vector3(0.3, 0, 0.5), params: { radius: 0.1 } },
        { type: "moving_wall", position: new Vector3(0, 0, -1), params: { width: 0.4, height: 0.12, range: 0.3, speed: 1.8, axis: "x" } },
      ],
      decorations: [
        { type: "pillar", position: new Vector3(-0.6, 0, 4.5), params: { height: 1.5 } },
        { type: "pillar", position: new Vector3(0.6, 0, 4.5), params: { height: 1.5 } },
        { type: "ring", position: new Vector3(0, 1.0, -4), params: { radius: 0.4, color: 0xff6600 } },
        { type: "orb", position: new Vector3(0, 1.5, -4), params: { radius: 0.1, color: 0xff6600 } },
      ],
      specialObstacles: [
        {
          type: "teleporter",
          position: new Vector3(0, 0, 1),
          params: { target: new Vector3(0, 0.05, -1.5), color: 0xff6600 },
        },
        {
          type: "ice_surface",
          position: new Vector3(0, 0, -1.5),
          params: { size: new Vector3(0.8, 0.01, 1.5) },
        },
        {
          type: "wind_zone",
          position: new Vector3(0, 0.3, -3.5),
          params: {
            direction: new Vector3(0, 0, 1),
            force: 2.5,
            size: new Vector3(0.8, 0.5, 1.5),
          },
        },
      ],
    },
  ],
};
