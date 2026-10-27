import { Html, Image, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentRef, Dispatch, RefObject, SetStateAction } from 'react'
import { Color, Plane, Raycaster, Spherical, Vector2, Vector3 } from 'three'
import { sceneConfig, surfaces } from './config/surfaces'

type EditableSurface = {
  id: string
  width: number
  height: number
  x: number
  y: number
  src: string
  radius: number
  alt?: string
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

function getPositionedSurfaces(): EditableSurface[] {
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

    const positioned = row.map((surface, surfaceIndex) => {
      const width = surface.width / unit
      const height = surface.height / unit
      const x = xCursor + width / 2
      xCursor += width + columnGap

      return {
        id: `surface-${rowIndex}-${surfaceIndex}`,
        width,
        height,
        x,
        y: yCursor - rowHeight / 2,
        src: surface.src,
        radius: surface.radius ?? sceneConfig.cornerRadius,
        alt: surface.alt,
      }
    })

    yCursor -= rowHeight + rowGap
    return positioned
  })
}

const SURFACES_KEY = 'surface-layout'

function readStoredSurfaces(): EditableSurface[] {
  const defaults = getPositionedSurfaces()
  try {
    const stored = localStorage.getItem(SURFACES_KEY)
    if (!stored) return defaults
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return defaults

    const valid = parsed.every((item): item is EditableSurface =>
      item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      Number.isFinite(item.width) && item.width > 0 &&
      Number.isFinite(item.height) && item.height > 0 &&
      Number.isFinite(item.x) &&
      Number.isFinite(item.y) &&
      typeof item.src === 'string' &&
      Number.isFinite(item.radius) && item.radius >= 0 &&
      (item.alt === undefined || typeof item.alt === 'string'),
    )
    return valid ? parsed as EditableSurface[] : defaults
  } catch {
    return defaults
  }
}

function ActionIcon({ name }: { name: 'more' | 'trash' | 'image' }) {
  if (name === 'more') {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></svg>
  }
  if (name === 'trash') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></svg>
}

type DragState = {
  id: string
  mode: 'move' | 'resize'
  offsetX: number
  offsetY: number
  cornerX?: -1 | 1
  cornerY?: -1 | 1
  anchorX?: number
  anchorY?: number
}

function SurfaceGrid({
  mode,
  items,
  setItems,
  selectedId,
  setSelectedId,
  onDelete,
}: {
  mode: 'scene' | 'edit'
  items: EditableSurface[]
  setItems: Dispatch<SetStateAction<EditableSurface[]>>
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  onDelete: (id: string) => void
}) {
  const { camera, gl } = useThree()
  const dragRef = useRef<DragState | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const raycaster = useMemo(() => new Raycaster(), [])
  const pointer = useMemo(() => new Vector2(), [])
  const plane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const intersection = useMemo(() => new Vector3(), [])

  const getPlanePoint = useCallback((clientX: number, clientY: number) => {
    const rect = gl.domElement.getBoundingClientRect()
    pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(pointer, camera)
    return raycaster.ray.intersectPlane(plane, intersection)?.clone() ?? null
  }, [camera, gl, intersection, plane, pointer, raycaster])

  const startDrag = useCallback((
    event: ThreeEvent<PointerEvent>,
    item: EditableSurface,
    dragMode: 'move' | 'resize',
    cornerX?: -1 | 1,
    cornerY?: -1 | 1,
  ) => {
    if (mode !== 'edit') return
    event.stopPropagation()
    event.nativeEvent.preventDefault()
    setSelectedId(item.id)
    const point = event.point
    dragRef.current = {
      id: item.id,
      mode: dragMode,
      offsetX: item.x - point.x,
      offsetY: item.y - point.y,
      cornerX,
      cornerY,
      anchorX: cornerX ? item.x - cornerX * item.width / 2 : undefined,
      anchorY: cornerY ? item.y - cornerY * item.height / 2 : undefined,
    }
    gl.domElement.style.cursor = dragMode === 'move' ? 'grabbing' : 'nwse-resize'
  }, [gl, mode, setSelectedId])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const point = getPlanePoint(event.clientX, event.clientY)
      if (!point) return

      setItems((current) => current.map((item) => {
        if (item.id !== drag.id) return item
        if (drag.mode === 'move') {
          return {
            ...item,
            x: point.x + drag.offsetX,
            y: point.y + drag.offsetY,
          }
        }

        const width = Math.max(0.25, (point.x - (drag.anchorX ?? 0)) * (drag.cornerX ?? 1))
        const height = Math.max(0.25, (point.y - (drag.anchorY ?? 0)) * (drag.cornerY ?? 1))
        return {
          ...item,
          width,
          height,
          x: (drag.anchorX ?? 0) + (drag.cornerX ?? 1) * width / 2,
          y: (drag.anchorY ?? 0) + (drag.cornerY ?? 1) * height / 2,
        }
      }))
    }

    const onPointerUp = () => {
      dragRef.current = null
      gl.domElement.style.cursor = ''
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [getPlanePoint, gl, mode, setItems])

  const updateImage = useCallback((id: string, file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      setItems((current) => current.map((item) =>
        item.id === id ? { ...item, src: reader.result as string, alt: file.name } : item,
      ))
    }
    reader.readAsDataURL(file)
  }, [setItems])

  return (
    <group>
      {items.map((item) => {
        const position: [number, number, number] = [item.x, item.y, 0]
        const selected = selectedId === item.id
        const cornerPositions = [
          { x: -1 as const, y: -1 as const },
          { x: -1 as const, y: 1 as const },
          { x: 1 as const, y: -1 as const },
          { x: 1 as const, y: 1 as const },
        ]

        return (
          <group key={item.id}>
            {item.src ? (
              <Image
                url={item.src}
                name={item.alt ?? item.src}
                position={position}
                scale={[item.width, item.height]}
                radius={item.radius}
                transparent
                toneMapped={false}
                onPointerDown={mode === 'edit' ? (event) => startDrag(event, item, 'move') : undefined}
                onPointerOver={mode === 'edit' ? () => { if (!dragRef.current) gl.domElement.style.cursor = 'grab' } : undefined}
                onPointerOut={mode === 'edit' ? () => { if (!dragRef.current) gl.domElement.style.cursor = '' } : undefined}
              />
            ) : (
              <mesh
                position={position}
                onPointerDown={mode === 'edit' ? (event) => startDrag(event, item, 'move') : undefined}
              >
                <planeGeometry args={[item.width, item.height]} />
                <meshBasicMaterial color="#e6e5df" />
              </mesh>
            )}

            {mode === 'edit' && selected && cornerPositions.map(({ x, y }) => (
              <Html
                key={`${x}-${y}`}
                position={[item.x + x * item.width / 2, item.y + y * item.height / 2, 0.08]}
                center
                transform={false}
                zIndexRange={[30, 0]}
              >
                <span
                  className="surface-resize-handle"
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    const startPoint = getPlanePoint(event.clientX, event.clientY)
                    if (!startPoint) return
                    dragRef.current = {
                      id: item.id,
                      mode: 'resize',
                      offsetX: 0,
                      offsetY: 0,
                      cornerX: x,
                      cornerY: y,
                      anchorX: item.x - x * item.width / 2,
                      anchorY: item.y - y * item.height / 2,
                    }
                    gl.domElement.style.cursor = 'nwse-resize'
                    setSelectedId(item.id)
                  }}
                />
              </Html>
            ))}

            {mode === 'edit' && (
              <Html
                position={[item.x + item.width / 2 - 0.18, item.y + item.height / 2 - 0.18, 0.12]}
                transform={false}
                zIndexRange={[20, 0]}
                style={{ pointerEvents: 'auto' }}
              >
                <div className="surface-context" onPointerDown={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="surface-menu-trigger"
                    aria-label={openMenuId === item.id ? 'Fermer le menu de la surface' : 'Ouvrir le menu de la surface'}
                    aria-expanded={openMenuId === item.id}
                    title="Options de la surface"
                    onClick={() => setOpenMenuId((current) => current === item.id ? null : item.id)}
                  >
                    <ActionIcon name="more" />
                  </button>
                  {openMenuId === item.id && (
                    <div className="surface-context-menu" role="group" aria-label="Actions de la surface">
                      <label className="surface-menu-action" title="Choisir une image">
                        <ActionIcon name="image" />
                        <span>Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          aria-label="Choisir une image pour cette surface"
                          onChange={(event) => {
                            updateImage(item.id, event.currentTarget.files?.[0])
                            event.currentTarget.value = ''
                            setOpenMenuId(null)
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="surface-menu-action surface-delete"
                        onClick={() => {
                          onDelete(item.id)
                          setOpenMenuId(null)
                        }}
                      >
                        <ActionIcon name="trash" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                </div>
              </Html>
            )}
            {mode === 'edit' && !item.src && (
              <Html position={position} center transform={false} zIndexRange={[10, 0]}>
                <span className="surface-placeholder">Choisir une image</span>
              </Html>
            )}
          </group>
        )
      })}
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
  mode,
  controlsRef,
  initialRoll,
  rollRef,
}: {
  mode: 'scene' | 'edit'
  controlsRef: ControlsRef
  initialRoll: number
  rollRef: RefObject<number>
}) {
  const { camera, gl, size } = useThree()
  const modeRef = useRef(mode)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

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
      if (event.button !== 0 || event.defaultPrevented) return
      dragging = true
      panning = spacePressed
      rolling = modeRef.current === 'scene' && event.shiftKey && !panning
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

      if ((panning || spacePressed) && !rolling) {
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
      } else if (modeRef.current === 'scene' && (rolling || event.shiftKey)) {
        rolling = true
        roll += dx * coeff
        syncSpherical()
        camera.lookAt(target)
        camera.rotateZ(roll)
        rollRef.current = roll
        saveCameraView(camera.position, target, roll)
      } else if (modeRef.current === 'scene') {
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


function ModeCamera({
  mode,
  controlsRef,
  initialView,
  rollRef,
}: {
  mode: 'scene' | 'edit'
  controlsRef: ControlsRef
  initialView: CameraView | null
  rollRef: RefObject<number>
}) {
  const { camera } = useThree()
  const previousMode = useRef<'scene' | 'edit'>(mode)
  const sceneView = useRef<CameraView | null>(null)

  useEffect(() => {
    if (previousMode.current === mode) return
    previousMode.current = mode

    const controls = controlsRef.current
    const currentTarget = controls?.target.clone() ?? new Vector3(...sceneConfig.camera.target)
    const fromPosition = camera.position.clone()
    const fromTarget = currentTarget.clone()
    const fromQuaternion = camera.quaternion.clone()
    const targetView = mode === 'edit'
      ? {
          position: new Vector3(currentTarget.x, currentTarget.y, currentTarget.z + 18),
          target: currentTarget.clone(),
          roll: 0,
        }
      : (() => {
          const view = sceneView.current ?? initialView
          return {
            position: new Vector3(...(view?.position ?? sceneConfig.camera.position)),
            target: new Vector3(...(view?.target ?? sceneConfig.camera.target)),
            roll: view?.roll ?? 0,
          }
        })()

    if (mode === 'edit') {
      sceneView.current = {
        position: camera.position.toArray() as [number, number, number],
        target: currentTarget.toArray() as [number, number, number],
        roll: rollRef.current,
      }
    }

    const toQuaternion = camera.quaternion.clone()
    camera.up.set(0, 1, 0)
    camera.position.copy(targetView.position)
    camera.lookAt(targetView.target)
    camera.rotateZ(targetView.roll)
    toQuaternion.copy(camera.quaternion)
    camera.position.copy(fromPosition)
    camera.quaternion.copy(fromQuaternion)

    const duration = 480
    const startTime = performance.now()
    let frame = 0
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      camera.position.copy(fromPosition).lerp(targetView.position, eased)
      const target = fromTarget.clone().lerp(targetView.target, eased)
      camera.up.set(0, 1, 0)
      camera.lookAt(target)
      camera.quaternion.slerp(toQuaternion, eased)
      if (controls) {
        controls.target.copy(target)
        controls.update()
      }
      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        rollRef.current = targetView.roll
        if (mode === 'scene') saveCameraView(camera.position, target, targetView.roll)
      }
    }
    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [camera, controlsRef, initialView, mode, rollRef])

  return null
}

export default function App() {
  const { camera } = sceneConfig
  const initialView = useMemo(readCameraView, [])
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const rollRef = useRef(initialView?.roll ?? 0)
  const [exportScene, setExportScene] = useState<ExportScene | null>(null)
  const [backgroundColor, setBackgroundColor] = useState(readBackgroundColor)
  const [items, setItems] = useState<EditableSurface[]>(readStoredSurfaces)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'scene' | 'edit'>('scene')
  const addSurface = useCallback(() => {
    const id = `surface-${crypto.randomUUID()}`
    setItems((current) => [...current, { id, width: 4.2, height: 3, x: 0, y: 0, src: '', radius: sceneConfig.cornerRadius }])
    setSelectedId(id)
  }, [])
  const deleteSurface = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    setSelectedId((current) => current === id ? null : current)
  }, [])
  const handleExportReady = useCallback<ExportSceneSetter>((exporter) => {
    setExportScene(() => exporter)
  }, [])


  useEffect(() => {
    try {
      localStorage.setItem(SURFACES_KEY, JSON.stringify(items))
    } catch {
      // Large images or unavailable storage must not break editing.
    }
  }, [items])

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
          {mode === 'scene'
            ? 'Glisse pour orienter la caméra, maintiens Maj pour l’incliner, Espace + clic gauche pour déplacer la vue, et utilise la molette pour zoomer.'
            : 'Espace + clic gauche pour déplacer la vue, molette pour zoomer. Glisse les coins pour redimensionner une surface, son intérieur pour la déplacer, et le bouton ⋯ pour ses options.'}
        </p>
        <div className="header-actions">
          <div className="mode-switch" role="group" aria-label="Mode de travail">
            <button type="button" className={mode === 'scene' ? 'is-active' : ''} aria-pressed={mode === 'scene'} onClick={() => setMode('scene')}>Scène</button>
            <button type="button" className={mode === 'edit' ? 'is-active' : ''} aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}>Édition</button>
          </div>
          {mode === 'edit' && <button type="button" className="add-surface-button" onClick={addSurface}>+ Surface</button>}
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
          <SurfaceGrid mode={mode} items={items} setItems={setItems} selectedId={selectedId} setSelectedId={setSelectedId} onDelete={deleteSurface} />
          <ModeCamera mode={mode} controlsRef={controlsRef} initialView={initialView} rollRef={rollRef} />
          <ThreeAxisCameraControls
            mode={mode}
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
