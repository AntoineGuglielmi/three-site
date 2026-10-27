import { Image, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import type { Surface } from "./config/surfaces";
import { sceneConfig, surfaces } from "./config/surfaces";

type PositionedSurface = {
  surface: Surface;
  position: [number, number, number];
  key: string;
};

function getPositionedSurfaces(): PositionedSurface[] {
  const unit = sceneConfig.pixelsPerUnit;
  const columnGap = sceneConfig.columnGap / unit;
  const rowGap = sceneConfig.rowGap / unit;
  const rowHeights = surfaces.map((row) => Math.max(0, ...row.map((item) => item.height / unit)));
  const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0)
    + Math.max(0, surfaces.length - 1) * rowGap;
  let yCursor = totalHeight / 2;

  return surfaces.flatMap((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex];
    const rowWidth = row.reduce((sum, item) => sum + item.width / unit, 0)
      + Math.max(0, row.length - 1) * columnGap;
    let xCursor = -rowWidth / 2;
    const y = yCursor - rowHeight / 2;

    const positioned = row.map((surface, surfaceIndex) => {
      const width = surface.width / unit;
      const x = xCursor + width / 2;
      xCursor += width + columnGap;

      return {
        surface,
        position: [x, y, 0] as [number, number, number],
        key: `${rowIndex}-${surfaceIndex}-${surface.src}`,
      };
    });

    yCursor -= rowHeight + rowGap;
    return positioned;
  });
}

function SurfaceGrid() {
  const items = useMemo(getPositionedSurfaces, []);

  return (
    <group>
      {items.map(({ surface, position, key }) => (
        <Image
          key={key}
          url={surface.src}
          name={surface.alt ?? surface.src}
          position={position}
          scale={[
            surface.width / sceneConfig.pixelsPerUnit,
            surface.height / sceneConfig.pixelsPerUnit,
          ]}
          radius={surface.radius ?? sceneConfig.cornerRadius}
          toneMapped={false}
        />
      ))}
    </group>
  );
}

export default function App() {
  const { camera } = sceneConfig;

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">THREE.JS / IMAGE MOCKUPS</p>
          <h1>Surface</h1>
          <p className="intro">
            Une grille de surfaces pour mettre des images en scène. La disposition se règle
            dans <code>src/config/surfaces.ts</code>.
          </p>
        </div>
        <div className="help-note">
          <span className="status-dot" />
          <span>Glisser pour tourner · Molette pour zoomer</span>
        </div>
      </header>

      <section className="scene-frame" aria-label="Aperçu 3D des surfaces">
        <Canvas
          camera={{
            position: camera.position,
            fov: camera.fov,
            near: 0.1,
            far: 100,
          }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={[sceneConfig.background]} />
          <ambientLight intensity={2} />
          <SurfaceGrid />
          <OrbitControls
            makeDefault
            target={camera.target}
            enablePan={false}
            minDistance={4}
            maxDistance={22}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
        <div className="scene-caption">
          <span>{surfaces.length} rangées</span>
          <span>{surfaces.reduce((count, row) => count + row.length, 0)} surfaces</span>
        </div>
      </section>

      <footer className="page-footer">
        <p>Chaque image est une surface indépendante, avec ses propres dimensions et son propre fichier.</p>
        <p>Images de démonstration · remplace les <code>src</code> par tes visuels.</p>
      </footer>
    </main>
  );
}
