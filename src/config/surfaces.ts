export type Surface = {
  /** Width in pixels, converted to 3D units by pixelsPerUnit. */
  width: number;
  /** Height in pixels, converted to 3D units by pixelsPerUnit. */
  height: number;
  /** Image URL or a path inside /public, e.g. /images/project-a.jpg. */
  src: string;
  /** Optional rounded-corner amount between 0 and 1. */
  radius?: number;
  /** Optional accessible description for this image. */
  alt?: string;
};

export const sceneConfig = {
  background: "#f4f3f0",
  /** 100 source pixels become one Three.js world unit. */
  pixelsPerUnit: 100,
  /** Horizontal gap between surfaces, in source pixels. */
  columnGap: 28,
  /** Vertical gap between rows, in source pixels. */
  rowGap: 34,
  /** Rounded corner amount between 0 and 1. */
  cornerRadius: 0.055,
  camera: {
    /** Initial camera position [x, y, z]. */
    position: [0, 3.2, 10] as [number, number, number],
    /** Point the camera looks at [x, y, z]. */
    target: [0, 0, 0] as [number, number, number],
    /** Perspective field of view in degrees. */
    fov: 38,
  },
};

/**
 * Each nested array is a row. Each object is one image surface.
 * Width and height are expressed in pixels, then scaled into the 3D scene.
 * Replace these demo URLs with local files in public/images or your own URLs.
 */
export const surfaces: Surface[][] = [
  [
    {
      width: 340,
      height: 230,
      src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
      alt: "Espace de travail lumineux",
    },
    {
      width: 280,
      height: 230,
      src: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85",
      alt: "Intérieur aux tons doux",
    },
    {
      width: 340,
      height: 230,
      src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85",
      alt: "Bureau contemporain",
    },
  ],
  [
    {
      width: 280,
      height: 190,
      src: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85",
      alt: "Composition d'intérieur",
    },
    {
      width: 340,
      height: 190,
      src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
      alt: "Espace de travail",
    },
    {
      width: 340,
      height: 190,
      src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85",
      alt: "Bureau lumineux",
    },
  ],
];
