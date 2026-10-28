export const sceneConfig = {
  background: '#f4f3f0',
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
}
