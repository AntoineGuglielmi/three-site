import { Image, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { CanvasTexture, Color, SRGBColorSpace, Spherical, Vector3 } from 'three'
import type { Surface } from './config/surfaces'
import { sceneConfig, surfaces } from './config/surfaces'

type PositionedSurface = {
  surface: Surface
  position: [number, number, number]
  key: string
}

type ControlsRef = RefObject<ComponentRef<typeof OrbitControls> | null>

type CameraView = {
  position: [number, number, number]
  target: [number, number, number]
  roll: number
}

const CAMERA_VIEW_KEY = 'surface-camera-view'
const BACKGROUND_COLOR_KEY = 'surface-background-color'

function readBackgroundColor(): string {
  try {
    const stored = localStorage.getItem(BACKGROUND_COLOR_KEY)
    return stored && /^#[0-9a-f]{6}$/i.test(stored)
      ? stored
      : sceneConfig.background
  } catch {
    return sceneConfig.background
  }
}

function readCameraView(): CameraView | null {
  try {
    const stored = localStorage.getItem(CAMERA_VIEW_KEY)
    if (!stored) return null
    const view = JSON.parse(stored) as CameraView
    if (
      !Array.isArray(view.position) ||
      view.position.length !== 3 ||
      !view.position.every(Number.isFinite) ||
      !Array.isArray(view.target) ||
      view.target.length !== 3 ||
      !view.target.every(Number.isFinite) ||
      !Number.isFinite(view.roll)
    )
      return null
    return view
  } catch {
    return null
  }
}

function saveCameraView(position: Vector3, target: Vector3, roll: number) {
  try {
    const view: CameraView = {
      position: position.toArray() as [number, number, number],
      target: target.toArray() as [number, number, number],
      roll,
    }
    localStorage.setItem(CAMERA_VIEW_KEY, JSON.stringify(view))
  } catch {
    // The scene remains usable when storage is unavailable.
  }
}

function getPositionedSurfaces(): PositionedSurface[] {
  const unit = sceneConfig.pixelsPerUnit
  const columnGap = sceneConfig.columnGap / unit
  const rowGap = sceneConfig.rowGap / unit
  const rowHeights = surfaces.map((row) =>
    Math.max(0, ...row.map((item) => item.height / unit)),
  )
  const totalHeight =
    rowHeights.reduce((sum, height) => sum + height, 0) +
    Math.max(0, surfaces.length - 1) * rowGap
  let yCursor = totalHeight / 2

  return surfaces.flatMap((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex]
    const rowWidth =
      row.reduce((sum, item) => sum + item.width / unit, 0) +
      Math.max(0, row.length - 1) * columnGap
    let xCursor = -rowWidth / 2
    const y = yCursor - rowHeight / 2

    const positioned = row.map((surface, surfaceIndex) => {
      const width = surface.width / unit
      const x = xCursor + width / 2
      xCursor += width + columnGap

      return {
        surface,
        position: [x, y, 0] as [number, number, number],
        key: `${rowIndex}-${surfaceIndex}-${surface.src}`,
      }
    })

    yCursor -= rowHeight + rowGap
    return positioned
  })
}

function createShadowTexture(width: number, height: number, radius: number) {
  const canvas = document.createElement('canvas')
  const scale = 2
  const padding = 48
  canvas.width = Math.max(1, Math.round(width * sceneConfig.pixelsPerUnit * scale)) + padding * 2
  canvas.height = Math.max(1, Math.round(height * sceneConfig.pixelsPerUnit * scale)) + padding * 2

  const context = canvas.getContext('2d')
  if (!context) return null

  const x = padding
  const y = padding
  const w = canvas.width - padding * 2
  const h = canvas.height - padding * 2
  const r = Math.min(radius * Math.min(w, h), w / 2, h / 2)

  context.fillStyle = '#000'
  context.shadowColor = 'rgba(0, 0, 0, 0.24)'
  context.shadowBlur = 24
  context.shadowOffsetX = 0
  context.shadowOffsetY = 12
  context.beginPath()
  context.roundRect(x, y, w, h, r)
  context.fill()

  // Keep only the blurred shadow, not the opaque shape underneath the image.
  context.shadowColor = 'transparent'
  context.shadowBlur = 0
  context.shadowOffsetY = 0
  context.globalCompositeOperation = 'destination-out'
  context.beginPath()
  context.roundRect(x, y, w, h, r)
  context.fill()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function SurfaceShadow({
  surface,
  position,
}: {
  surface: Surface
  position: [number, number, number]
}) {
  const width = surface.width / sceneConfig.pixelsPerUnit
  const height = surface.height / sceneConfig.pixelsPerUnit
  const radius = surface.radius ?? sceneConfig.cornerRadius
  const texture = useMemo(
    () => createShadowTexture(width, height, radius),
    [height, radius, width],
  )

  useEffect(() => () => texture?.dispose(), [texture])
  if (!texture) return null

  const padding = 48 / 2
  const shadowWidth = width + padding * 2 / sceneConfig.pixelsPerUnit
  const shadowHeight = height + padding * 2 / sceneConfig.pixelsPerUnit

  return (
    <mesh
      position={[position[0], position[1] - 0.035, position[2] - 0.01]}
      renderOrder={0}
    >
      <planeGeometry args={[shadowWidth, shadowHeight]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.8}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

function SurfaceGrid() {
  const items = useMemo(getPositionedSurfaces, [])

  return (
    <group>
      {items.map(({ surface, position, key }) => (
        <group key={key}>
          <SurfaceShadow surface={surface} position={position} />
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
          transparent
          toneMapped={false}
        />
        </group>
      ))}
    </group>
  )
}

type ExportFormat = 'png' | 'jpg'
type ExportScene = (format: ExportFormat) => void
type ExportSceneSetter = (exporter: ExportScene | null) => void

function SceneExporter({
  onReady,
  backgroundColor,
}: {
  onReady: ExportSceneSetter
  backgroundColor: string
}) {
  const { camera, gl, scene } = useThree()

  const exportScene = useCallback<ExportScene>(
    (format) => {
      const previousBackground = scene.background
      const previousClearColor = gl.getClearColor(new Color()).clone()
      const previousClearAlpha = gl.getClearAlpha()
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'

      // Render and capture synchronously so the next R3F frame cannot replace
      // the export frame before the browser reads the canvas.
      const exportBackground = new Color(
        format === 'png' ? backgroundColor : 0xffffff,
      )
      scene.background = exportBackground
      gl.setClearColor(exportBackground, 1)

      try {
        gl.render(scene, camera)
        const dataUrl = gl.domElement.toDataURL(
          mimeType,
          format === 'jpg' ? 0.92 : undefined,
        )
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `surface-${Date.now()}.${format}`
        link.click()
      } finally {
        scene.background = previousBackground
        gl.setClearColor(previousClearColor, previousClearAlpha)
        gl.render(scene, camera)
      }
    },
    [backgroundColor, camera, gl, scene],
  )

  useEffect(() => {
    onReady(exportScene)
    return () => onReady(null)
  }, [exportScene, onReady])

  return null
}

/** Drag to orbit, Shift + drag to roll, or Space + drag to pan the camera. */
function ThreeAxisCameraControls({
  controlsRef,
  initialRoll,
  rollRef,
}: {
  controlsRef: ControlsRef
  initialRoll: number
  rollRef: RefObject<number>
}) {
  const { camera, gl, size } = useThree()

  const coeff = 0.001

  useEffect(() => {
    const element = gl.domElement
    const initialTarget = new Vector3(...sceneConfig.camera.target)
    const target = new Vector3()
    const spherical = new Spherical()
    const offset = new Vector3()
    const right = new Vector3()
    const up = new Vector3()
    const panOffset = new Vector3()
    const pointer = { x: 0, y: 0 }
    let dragging = false
    let rolling = false
    let panning = false
    let spacePressed = false
    let roll = initialRoll
    rollRef.current = roll

    const syncSpherical = () => {
      target.copy(controlsRef.current?.target ?? initialTarget)
      offset.copy(camera.position).sub(target)
      spherical.setFromVector3(offset)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return
      const targetElement = event.target
      if (
        targetElement instanceof HTMLElement &&
        (targetElement.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(
            targetElement.tagName,
          ))
      )
        return
      spacePressed = true
      if (dragging) panning = true
      event.preventDefault()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      spacePressed = false
    }

    const onBlur = () => {
      spacePressed = false
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      dragging = true
      panning = spacePressed
      rolling = event.shiftKey && !panning
      pointer.x = event.clientX
      pointer.y = event.clientY
      element.setPointerCapture(event.pointerId)
      syncSpherical()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return
      const dx = event.clientX - pointer.x
      const dy = event.clientY - pointer.y
      pointer.x = event.clientX
      pointer.y = event.clientY

      if (panning || (spacePressed && !rolling)) {
        panning = true
        syncSpherical()
        const distance = Math.max(offset.length(), 0.001)
        const worldUnitsPerPixel =
          (2 * distance * Math.tan((camera.fov * Math.PI) / 360)) / size.height
        camera.updateMatrixWorld()
        right.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
        up.setFromMatrixColumn(camera.matrixWorld, 1).normalize()
        panOffset
          .copy(right)
          .multiplyScalar(-dx * worldUnitsPerPixel)
          .addScaledVector(up, dy * worldUnitsPerPixel)
        camera.position.add(panOffset)
        target.add(panOffset)
        if (controlsRef.current) {
          controlsRef.current.target.copy(target)
          controlsRef.current.update()
        }
        saveCameraView(camera.position, target, roll)
      } else if (rolling || event.shiftKey) {
        rolling = true
        roll += dx * coeff
        syncSpherical()
        camera.lookAt(target)
        camera.rotateZ(roll)
        rollRef.current = roll
        saveCameraView(camera.position, target, roll)
      } else {
        syncSpherical()
        spherical.theta -= dx * coeff
        spherical.phi = Math.max(
          0.08,
          Math.min(Math.PI - 0.08, spherical.phi - dy * coeff),
        )
        offset.setFromSpherical(spherical)
        camera.position.copy(target).add(offset)
        camera.lookAt(target)
        camera.rotateZ(roll)
        rollRef.current = roll
        saveCameraView(camera.position, target, roll)
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      dragging = false
      rolling = false
      panning = false
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId)
      }
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerUp)
    element.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', onPointerUp)
      element.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [camera, controlsRef, gl, initialRoll, rollRef, size.height])

  return null
}

export default function App() {
  const { camera } = sceneConfig
  const initialView = useMemo(readCameraView, [])
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const rollRef = useRef(initialView?.roll ?? 0)
  const [exportScene, setExportScene] = useState<ExportScene | null>(null)
  const [backgroundColor, setBackgroundColor] = useState(readBackgroundColor)
  const handleExportReady = useCallback<ExportSceneSetter>((exporter) => {
    setExportScene(() => exporter)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(BACKGROUND_COLOR_KEY, backgroundColor)
    } catch {
      // The color picker remains usable when storage is unavailable.
    }
  }, [backgroundColor])

  return (
    <main className="app-shell">
      <header className="page-header">
        <h1>Surface</h1>
        <p className="intro">
          Une grille de surfaces pour mettre des images en scène. Modifie leur
          disposition, leurs dimensions et leurs fichiers dans{' '}
          <code>src/config/surfaces.ts</code>. Glisse pour orienter la vue,
          maintiens Maj en glissant pour incliner la caméra, maintiens Espace en
          glissant pour déplacer la vue, et utilise la molette pour zoomer.
        </p>
        <div className="header-actions">
          <label className="background-control">
            <span>Fond</span>
            <input
              type="color"
              aria-label="Couleur de fond du canvas"
              value={backgroundColor}
              onChange={(event) =>
                setBackgroundColor(event.currentTarget.value)
              }
            />
          </label>
          <div
            className="export-actions"
            aria-label="Exporter les surfaces"
          >
            <button
              type="button"
              onClick={() => exportScene?.('png')}
              disabled={!exportScene}
            >
              PNG
            </button>
            <button
              type="button"
              onClick={() => exportScene?.('jpg')}
              disabled={!exportScene}
            >
              JPG
            </button>
          </div>
        </div>
      </header>

      <section
        className="scene-stage"
        aria-label="Aperçu 3D des surfaces"
      >
        <Canvas
          camera={{
            position: initialView?.position ?? camera.position,
            fov: camera.fov,
            near: 0.1,
            far: 100,
          }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        >
          <color
            attach="background"
            args={[backgroundColor]}
          />
          <ambientLight intensity={2} />
          <SurfaceGrid />
          <ThreeAxisCameraControls
            controlsRef={controlsRef}
            initialRoll={initialView?.roll ?? 0}
            rollRef={rollRef}
          />
          <SceneExporter
            onReady={handleExportReady}
            backgroundColor={backgroundColor}
          />
          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={initialView?.target ?? camera.target}
            onChange={() => {
              const target = controlsRef.current?.target
              if (target) {
                saveCameraView(
                  controlsRef.current?.object.position ?? new Vector3(),
                  target,
                  rollRef.current,
                )
              }
            }}
            enableRotate={false}
            enablePan={false}
            enableZoom
            zoomSpeed={0.1}
            minDistance={4}
            maxDistance={22}
          />
        </Canvas>
      </section>
    </main>
  )
}
