import { Image, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { ComponentRef, RefObject } from "react";
import { Spherical, Vector3 } from "three";
import type { Surface } from "./config/surfaces";
import { sceneConfig, surfaces } from "./config/surfaces";

type PositionedSurface = {
  surface: Surface;
  position: [number, number, number];
  key: string;
};

type ControlsRef = RefObject<ComponentRef<typeof OrbitControls> | null>;

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

/** Drag to orbit, Shift + drag to roll, or Space + drag to pan the camera. */
function ThreeAxisCameraControls({ controlsRef }: { controlsRef: ControlsRef }) {
  const { camera, gl, size } = useThree();

  useEffect(() => {
    const element = gl.domElement;
    const initialTarget = new Vector3(...sceneConfig.camera.target);
    const target = new Vector3();
    const spherical = new Spherical();
    const offset = new Vector3();
    const right = new Vector3();
    const up = new Vector3();
    const panOffset = new Vector3();
    const pointer = { x: 0, y: 0 };
    let dragging = false;
    let rolling = false;
    let panning = false;
    let spacePressed = false;
    let roll = 0;

    const syncSpherical = () => {
      target.copy(controlsRef.current?.target ?? initialTarget);
      offset.copy(camera.position).sub(target);
      spherical.setFromVector3(offset);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const targetElement = event.target;
      if (targetElement instanceof HTMLElement && (
        targetElement.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(targetElement.tagName)
      )) return;
      spacePressed = true;
      if (dragging) panning = true;
      event.preventDefault();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      spacePressed = false;
    };

    const onBlur = () => {
      spacePressed = false;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      panning = spacePressed;
      rolling = event.shiftKey && !panning;
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

      if (panning || (spacePressed && !rolling)) {
        panning = true;
        syncSpherical();
        const distance = Math.max(offset.length(), 0.001);
        const worldUnitsPerPixel = (2 * distance * Math.tan((camera.fov * Math.PI) / 360)) / size.height;
        camera.updateMatrixWorld();
        right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
        up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
        panOffset
          .copy(right)
          .multiplyScalar(-dx * worldUnitsPerPixel)
          .addScaledVector(up, dy * worldUnitsPerPixel);
        camera.position.add(panOffset);
        target.add(panOffset);
        if (controlsRef.current) {
          controlsRef.current.target.copy(target);
          controlsRef.current.update();
        }
      } else if (rolling || event.shiftKey) {
        rolling = true;
        roll += dx * 0.006;
        syncSpherical();
        camera.lookAt(target);
        camera.rotateZ(roll);
      } else {
        syncSpherical();
        spherical.theta -= dx * 0.006;
        spherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, spherical.phi - dy * 0.006));
        offset.setFromSpherical(spherical);
        camera.position.copy(target).add(offset);
        camera.lookAt(target);
        camera.rotateZ(roll);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      rolling = false;
      panning = false;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [camera, controlsRef, gl, size.height]);

  return null;
}

export default function App() {
  const { camera } = sceneConfig;
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);

  return (
    <main className="app-shell">
      <header className="page-header">
        <h1>Surface</h1>
        <p className="intro">
          Une grille de surfaces pour mettre des images en scène. Modifie leur disposition,
          leurs dimensions et leurs fichiers dans <code>src/config/surfaces.ts</code>.
          Glisse pour orienter la vue, maintiens Maj en glissant pour incliner la caméra,
          maintiens Espace en glissant pour déplacer la vue, et utilise la molette pour zoomer.
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
          <ThreeAxisCameraControls controlsRef={controlsRef} />
          <OrbitControls
            ref={controlsRef}
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
