import { Image, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Spherical, Vector3 } from "three";
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

/** Drag to orbit around the grid; Shift + drag rolls the camera around its view axis. */
function ThreeAxisCameraControls() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const element = gl.domElement;
    const target = new Vector3(...sceneConfig.camera.target);
    const spherical = new Spherical();
    const offset = new Vector3();
    const pointer = { x: 0, y: 0 };
    let dragging = false;
    let rolling = false;
    let roll = 0;

    const syncSpherical = () => {
      offset.copy(camera.position).sub(target);
      spherical.setFromVector3(offset);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      rolling = event.shiftKey;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      element.setPointerCapture(event.pointerId);
      syncSpherical();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (event.shiftKey || rolling) {
        roll += dx * 0.006;
      } else {
        spherical.theta -= dx * 0.006;
        spherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, spherical.phi - dy * 0.006));
        offset.setFromSpherical(spherical);
        camera.position.copy(target).add(offset);
      }

      camera.lookAt(target);
      camera.rotateZ(roll);
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
    };
  }, [camera, gl]);

  return null;
}

export default function App() {
  const { camera } = sceneConfig;

  return (
    <main className="app-shell">
      <header className="page-header">
        <h1>Surface</h1>
        <p className="intro">
          Une grille de surfaces pour mettre des images en scène. Modifie leur disposition,
          leurs dimensions et leurs fichiers dans <code>src/config/surfaces.ts</code>.
          Glisse pour orienter la vue, maintiens Maj en glissant pour incliner la caméra,
          et utilise la molette pour zoomer.
        </p>
      </header>

      <section className="scene-stage" aria-label="Aperçu 3D des surfaces">
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
          <ThreeAxisCameraControls />
          <OrbitControls
            makeDefault
            target={camera.target}
            enableRotate={false}
            enablePan={false}
            enableZoom
            minDistance={4}
            maxDistance={22}
          />
        </Canvas>
      </section>
    </main>
  );
}
