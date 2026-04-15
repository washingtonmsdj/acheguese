import { z } from "zod";
import type { OrdaxSpec } from "@/lib/ordax/types";

// ✅ FIX: Accept any string for gameType (100% generic system)
export const ordaxGameTypeSchema = z.string().min(1);

export const ordaxEntitySchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  visual: z.object({
    shape: z.string().min(1),
    orientation: z.enum(["up", "down", "left", "right"]).optional(),
    color: z.string().optional(),
    strokeColor: z.string().optional(),
    strokeWidth: z.number().optional(),
    fill: z.boolean().optional(),
    details: z.record(z.unknown()).optional(),
    path: z.string().optional(),
  }).optional(),
  props: z.record(z.unknown()).optional(),
  sprite: z.object({
    url: z.string().min(1),
    frameWidth: z.number().positive(),
    frameHeight: z.number().positive(),
    currentAnimation: z.string().optional(),
  }).optional(),
});

const ordaxVisualThemeSchema = z
  .object({
    background: z.string().min(1).optional(),
    primary: z.string().min(1).optional(),
    accent: z.string().min(1).optional(),
    font: z.string().min(1).optional(),
  })
  .optional();

// ✅ FIX: Accept any string for background layer type (100% generic)
const ordaxBackgroundLayerSchema = z.object({
  type: z.string().min(1),
  parallax: z.number().min(0).max(1).optional(),
  density: z.number().min(0).optional(),
  speedY: z.number().optional(),
}).passthrough(); // Allow custom properties

const ordaxBackgroundSchema = z
  .object({
    layers: z.array(ordaxBackgroundLayerSchema).optional(),
  })
  .passthrough() // Allow racingRoad and other custom configs
  .optional();

const ordaxAudioSchema = z
  .object({
    music: z.string().min(1).optional(),
    sounds: z.record(z.string().min(1)).optional(),
  })
  .optional();

export const ordaxSpecSchema: z.ZodType<OrdaxSpec> = z.object({
  gameType: ordaxGameTypeSchema,
  title: z.string().min(1),
  description: z.string(),
  systems: z.array(z.string().min(1)),
  gameplay: z.record(z.unknown()).optional(),
  player: z.record(z.unknown()).optional(),
  spawners: z.record(z.unknown()).optional(),
  visual: z
    .object({
      theme: ordaxVisualThemeSchema,
      background: ordaxBackgroundSchema,
    })
    .optional(),
  audio: ordaxAudioSchema,
  ui: z.record(z.unknown()).optional(),
  runtime: z.record(z.unknown()).optional(),
  scene: z.object({
    gravity: z.object({ x: z.number(), y: z.number() }),
    entities: z.array(ordaxEntitySchema),
  }),
}).passthrough() as unknown as z.ZodType<OrdaxSpec>;
