import { z } from "zod";

export const APP_NAME = "Touch Grass";
export const AI_MODEL = "gemini-3.5-flash-lite";
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTOS = 3;
export const stages = [
  "Not sure",
  "New leaves",
  "In flower",
  "In fruit",
  "Changing leaves",
  "Bare branches",
] as const;
export const identificationSchema = z.object({
  isPlant: z.boolean(),
  commonName: z.string().max(120),
  scientificName: z.string().max(160),
  family: z.string().max(120),
  confidence: z.enum(["likely", "possible", "uncertain"]),
  summary: z.string().max(700),
  features: z.array(z.string().max(240)).max(4),
  habitat: z.string().max(400),
  ecology: z.string().max(400),
  fact: z.string().max(400),
  nextPhoto: z.string().max(240),
  alternatives: z
    .array(
      z.object({
        commonName: z.string().max(120),
        scientificName: z.string().max(160),
        difference: z.string().max(300),
      }),
    )
    .max(3),
});
export type Identification = z.infer<typeof identificationSchema>;
export const imageInputSchema = z.object({
  data: z.string().max(MAX_PHOTO_BYTES * 1.4),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});
export const identifyInputSchema = z.object({
  images: z.array(imageInputSchema).min(1).max(MAX_PHOTOS),
  region: z.string().max(120).optional(),
});
export type IdentifyInput = z.infer<typeof identifyInputSchema>;
export const discoveryInputSchema = z.object({
  id: z.uuid(),
  photoIds: z.array(z.uuid()).min(1).max(MAX_PHOTOS),
  commonName: z.string().trim().min(1).max(120),
  scientificName: z.string().trim().max(160).default(""),
  identification: identificationSchema.nullable(),
  nickname: z.string().trim().max(100).default(""),
  notes: z.string().max(2000).default(""),
  place: z.string().trim().max(160).default(""),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  stage: z.enum(stages).default("Not sure"),
  observedAt: z.iso.datetime(),
});
export const discoveryEditSchema = discoveryInputSchema
  .pick({
    commonName: true,
    scientificName: true,
    nickname: true,
    notes: true,
    place: true,
  })
  .extend({ id: z.uuid(), followed: z.boolean() });
export const visitInputSchema = z.object({
  id: z.uuid(),
  discoveryId: z.uuid(),
  photoIds: z.array(z.uuid()).min(1).max(MAX_PHOTOS),
  notes: z.string().max(2000),
  stage: z.enum(stages),
  observedAt: z.iso.datetime(),
});
export const pushInputSchema = z.object({
  endpoint: z.url().max(2048),
  keys: z.object({
    p256dh: z.string().min(40).max(200),
    auth: z.string().min(16).max(100),
  }),
});
export const confidenceLabels: Record<Identification["confidence"], string> = {
  likely: "Likely match",
  possible: "Possible match",
  uncertain: "Needs a closer look",
};
export const challenges = [
  {
    id: "first",
    title: "A first hello",
    description:
      "Save your first discovery. Any tree is a good place to start.",
    target: 1,
    measure: "discoveries",
  },
  {
    id: "five",
    title: "Your own little forest",
    description: "Get to know five individual trees or plants.",
    target: 5,
    measure: "discoveries",
  },
  {
    id: "variety",
    title: "Look a little closer",
    description: "Find three different species on your everyday walks.",
    target: 3,
    measure: "species",
  },
  {
    id: "return",
    title: "An old friend",
    description: "Return to a discovery and add another visit.",
    target: 1,
    measure: "visits",
  },
] as const;

export function countSpecies(items: { scientificName: string }[]) {
  return new Set(
    items
      .map((item) => item.scientificName.trim().toLowerCase())
      .filter(
        (name) => /^[a-z]+ [a-z-]+$/.test(name) && !/ (sp|spp)$/.test(name),
      ),
  ).size;
}
