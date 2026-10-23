import { Github, MoveUpRight, X } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, PointerLockControls, Sparkles, Text } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackSide, Group, Vector3 } from "three";

type ZoneId = "home" | "projects" | "about" | "contact";
type Zone = { id: ZoneId; label: string; position: [number, number, number]; lookAt: [number, number, number] };
type Project = { number: string; title: string; type: string; description: string; shape: "knot" | "crystal" | "cube"; color: string };

const zones: Zone[] = [
  { id: "home", label: "Accueil", position: [0, 1.65, 7], lookAt: [0, 1.8, -2] },
  { id: "projects", label: "Projets", position: [12, 1.65, 2], lookAt: [12, 1.8, -5] },
  { id: "about", label: "À propos", position: [-12, 1.65, 2], lookAt: [-12, 1.8, -5] },
  { id: "contact", label: "Contact", position: [0, 1.65, -11], lookAt: [0, 1.8, -19] },
];
const projects: Project[] = [
  { number: "01", title: "Spatial interface", type: "EXPERIMENT / WEBGL", description: "Des interfaces qui se vivent comme des lieux, pas comme des pages.", shape: "knot", color: "#aaa1ff" },
  { number: "02", title: "Generative matter", type: "CREATIVE CODE", description: "Des formes organiques qui naissent du mouvement et de règles simples.", shape: "crystal", color: "#9df5df" },
  { number: "03", title: "Soft machines", type: "INTERACTION DESIGN", description: "Des objets numériques qui répondent au toucher et à la curiosité.", shape: "cube", color: "#ffbfa5" },
];
type Destination = { position: Vector3; lookAt: Vector3 };

function World({ destination, onArrive, onSelectProject, activeProject }: {
  destination: Destination | null; onArrive: () => void; onSelectProject: (project: Project) => void; activeProject: Project | null;
}) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const forward = useMemo(() => new Vector3(), []);
  const right = useMemo(() => new Vector3(), []);
  const movement = useMemo(() => new Vector3(), []);
  const arrived = useRef(false);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault(); keys.current.add(key);
      }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", clear);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", clear); };
  }, []);

  useFrame((_, delta) => {
    if (destination) {
      arrived.current = false;
      camera.position.lerp(destination.position, 1 - Math.exp(-delta * 2.2));
      camera.lookAt(destination.lookAt);
      if (camera.position.distanceTo(destination.position) < 0.12 && !arrived.current) { arrived.current = true; onArrive(); }
      return;
    }
    if (activeProject) return;
    const keysDown = keys.current;
    const x = Number(keysDown.has("d") || keysDown.has("arrowright")) - Number(keysDown.has("a") || keysDown.has("arrowleft"));
    const z = Number(keysDown.has("s") || keysDown.has("arrowdown")) - Number(keysDown.has("w") || keysDown.has("arrowup"));
    if (!x && !z) return;
    camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
    right.crossVectors(forward, camera.up).normalize();
    movement.set(0, 0, 0).addScaledVector(forward, -z).addScaledVector(right, x).normalize();
    camera.position.addScaledVector(movement, Math.min(delta, 0.05) * 4.2);
    camera.position.x = Math.max(-23, Math.min(23, camera.position.x));
    camera.position.z = Math.max(-25, Math.min(11, camera.position.z));
    camera.position.y = 1.65;
  });

  return <>
    <color attach="background" args={["#08090d"]} />
    <fog attach="fog" args={["#08090d", 18, 43]} />
    <ambientLight intensity={0.7} />
    <hemisphereLight args={["#c3c0ff", "#12151c", 1.15]} />
    <directionalLight position={[4, 10, 5]} intensity={2.2} color="#e7e5ff" />
    <pointLight position={[0, 5, -2]} intensity={36} distance={25} color="#8174ff" />
    <pointLight position={[13, 4, -5]} intensity={28} distance={18} color="#6de5cc" />
    <pointLight position={[-12, 3, -5]} intensity={22} distance={18} color="#b3a6ff" />
    <pointLight position={[0, 4, -19]} intensity={28} distance={16} color="#ffbfa5" />
    <mesh><sphereGeometry args={[31, 48, 32]} /><meshBasicMaterial color="#7770c5" side={BackSide} wireframe transparent opacity={0.055} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -6]}><planeGeometry args={[90, 90]} /><meshStandardMaterial color="#0b0d12" roughness={0.92} metalness={0.12} /></mesh>
    <gridHelper args={[80, 80, "#37334f", "#1b1b2a"]} position={[0, -0.1, -6]} />
    <Sparkles count={170} scale={[46, 17, 48]} size={1.5} speed={0.18} opacity={0.5} color="#c5c1ff" />
    <Platform position={[0, 0, 0]} color="#9387ff" label="01 / ARRIVAL" />
    <Platform position={[12, 0, -4]} color="#9df5df" label="02 / PROJECTS" />
    <Platform position={[-12, 0, -4]} color="#aaa1ff" label="03 / ABOUT" />
    <Platform position={[0, 0, -18]} color="#ffbfa5" label="04 / CONTACT" />
    <Portal position={[0, 0, -4]} color="#9387ff" />
    <Portal position={[12, 0, -8]} color="#9df5df" />
    <Portal position={[-12, 0, -8]} color="#aaa1ff" />
    <Portal position={[0, 0, -22]} color="#ffbfa5" />

    <group>
      <Text position={[0, 3.1, -0.1]} fontSize={0.16} letterSpacing={0.16} color="#9df5df" anchorX="center">A SMALL WORLD, BUILT WITH CODE</Text>
      <Text position={[0, 2.15, -0.1]} fontSize={0.67} letterSpacing={-0.055} color="#f2f0ff" anchorX="center">Hello, I'm Antoine.</Text>
      <Text position={[0, 1.55, -0.1]} fontSize={0.22} color="#aaa9bb" anchorX="center">Frontend developer · Creative explorer</Text>
      <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.2}>
        <mesh position={[3.15, 1.7, -1.8]}><icosahedronGeometry args={[0.95, 1]} /><meshStandardMaterial color="#8b80ff" metalness={0.65} roughness={0.24} wireframe /></mesh>
      </Float>
      <Html position={[0, 0.45, 1.4]} center><div className="world-hint">APPROCHE-TOI <span>↓</span></div></Html>
    </group>

    <group position={[12, 0, -4]}>
      <Text position={[0, 3.4, 0]} fontSize={0.15} letterSpacing={0.18} color="#9df5df" anchorX="center">SELECTED EXPERIMENTS</Text>
      <Text position={[0, 2.8, 0]} fontSize={0.56} letterSpacing={-0.05} color="#f2f0ff" anchorX="center">Things in progress.</Text>
      {projects.map((project, index) => <Artifact key={project.number} project={project} position={[(index - 1) * 2.5, 1.25, 1.1]} selected={activeProject?.number === project.number} onSelect={onSelectProject} />)}
    </group>

    <group position={[-12, 0, -4]}>
      <Text position={[0, 3.1, 0]} fontSize={0.15} letterSpacing={0.18} color="#aaa1ff" anchorX="center">A BIT ABOUT ME</Text>
      <Text position={[0, 2.45, 0]} fontSize={0.58} letterSpacing={-0.05} color="#f2f0ff" anchorX="center">Curious by default.</Text>
      <Html position={[0, 1.1, 0.2]} center transform distanceFactor={3.4}>
        <div className="world-note"><p>J'aime quand le code dépasse sa fonction.</p><p>Des systèmes bien pensés, des interfaces sensibles, des détails qui changent tout.</p><span>REACT · TYPESCRIPT · THREE.JS</span></div>
      </Html>
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.25}>
        <mesh position={[-3.1, 1.6, -0.5]}><torusKnotGeometry args={[0.7, 0.18, 120, 16, 2, 3]} /><meshStandardMaterial color="#aaa1ff" metalness={0.72} roughness={0.22} /></mesh>
      </Float>
    </group>

    <group position={[0, 0, -18]}>
      <Text position={[0, 3.2, 0]} fontSize={0.15} letterSpacing={0.18} color="#ffbfa5" anchorX="center">THE NEXT THING STARTS HERE</Text>
      <Text position={[0, 2.5, 0]} fontSize={0.65} letterSpacing={-0.055} color="#f2f0ff" anchorX="center">Let's make something.</Text>
      <Html position={[0, 1.2, 0.25]} center transform distanceFactor={3.2}><a className="world-contact" href="mailto:hello@antoine-g.com">Dire bonjour <span>↗</span></a></Html>
      <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.35}>
        <mesh position={[2.8, 1.55, -0.8]}><torusGeometry args={[0.7, 0.18, 24, 64]} /><meshStandardMaterial color="#ffbfa5" metalness={0.6} roughness={0.25} /></mesh>
      </Float>
    </group>
    <PointerLockControls selector=".world-canvas" />
  </>;
}

function Platform({ position, color, label }: { position: [number, number, number]; color: string; label: string }) {
  return <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><ringGeometry args={[3.7, 4.5, 96]} /><meshBasicMaterial color={color} transparent opacity={0.5} side={2} /></mesh>
    <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[3.65, 4.1, 0.12, 96]} /><meshStandardMaterial color="#11131b" roughness={0.58} metalness={0.35} /></mesh>
    <Html position={[0, 0.18, 3.3]} center><div className="platform-label">{label}</div></Html>
  </group>;
}
function Portal({ position, color }: { position: [number, number, number]; color: string }) {
  return <group position={position}>
    <mesh position={[0, 2.25, 0]}><torusGeometry args={[1.65, 0.055, 16, 96]} /><meshBasicMaterial color={color} /></mesh>
    <mesh position={[0, 2.25, -0.08]}><circleGeometry args={[1.6, 64]} /><meshBasicMaterial color={color} transparent opacity={0.07} side={BackSide} /></mesh>
    <pointLight position={[0, 2.1, 0.5]} color={color} intensity={9} distance={7} />
  </group>;
}
function Artifact({ project, position, selected, onSelect }: { project: Project; position: [number, number, number]; selected: boolean; onSelect: (project: Project) => void }) {
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * (selected ? 0.8 : 0.22);
    group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + Number(project.number)) * 0.08;
  });
  return <group ref={group} position={position} onClick={(event) => { event.stopPropagation(); onSelect(project); }}>
    <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.12}>
      {project.shape === "knot" && <mesh><torusKnotGeometry args={[0.72, 0.2, 100, 16, 2, 3]} /><meshStandardMaterial color={project.color} metalness={0.65} roughness={0.2} /></mesh>}
      {project.shape === "crystal" && <mesh><icosahedronGeometry args={[0.85, 1]} /><meshStandardMaterial color={project.color} metalness={0.3} roughness={0.24} wireframe /></mesh>}
      {project.shape === "cube" && <mesh rotation={[0.35, 0.2, 0.1]}><boxGeometry args={[1.15, 1.15, 1.15]} /><meshPhysicalMaterial color={project.color} metalness={0.25} roughness={0.2} transmission={0.35} transparent opacity={0.92} /></mesh>}
    </Float>
    <mesh position={[0, -0.85, 0]}><cylinderGeometry args={[0.72, 0.9, 0.08, 48]} /><meshStandardMaterial color={selected ? project.color : "#282a36"} emissive={project.color} emissiveIntensity={selected ? 0.6 : 0.08} /></mesh>
    <Html position={[0, -1.35, 0]} center>
      <button className="artifact-label" onClick={(event) => { event.stopPropagation(); onSelect(project); }}><span>{project.number} / {project.type}</span>{project.title}<b>↗</b></button>
    </Html>
  </group>;
}

export default function App() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [activeZone, setActiveZone] = useState<ZoneId>("home");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [helpOpen, setHelpOpen] = useState(true);
  const goTo = useCallback((zone: Zone) => {
    setActiveProject(null); setActiveZone(zone.id);
    setDestination({ position: new Vector3(...zone.position), lookAt: new Vector3(...zone.lookAt) });
  }, []);
  const handleArrive = useCallback(() => setDestination(null), []);

  return <main className="world-shell">
    <div className="world-canvas" aria-label="Univers 3D explorable">
      <Canvas camera={{ position: zones[0].position, fov: 66 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}>
        <Suspense fallback={null}><World destination={destination} onArrive={handleArrive} onSelectProject={setActiveProject} activeProject={activeProject} /></Suspense>
      </Canvas>
    </div>
    <header className="world-topbar">
      <a className="world-wordmark" href="#home" onClick={(event) => { event.preventDefault(); goTo(zones[0]); }}><span className="wordmark-mark">a.</span><span>ANTOINE G.</span></a>
      <div className="world-status"><span className="live-dot" /> YOU ARE INSIDE THE SITE</div>
      <a className="source-link" href="https://github.com/AntoineGuglielmi/three-site" target="_blank" rel="noreferrer">SOURCE <Github size={14} /></a>
    </header>
    <nav className="world-nav" aria-label="Navigation du monde">
      {zones.map((zone, index) => <button key={zone.id} className={activeZone === zone.id ? "is-active" : ""} onClick={() => goTo(zone)}><span>0{index + 1}</span>{zone.label}</button>)}
    </nav>
    <div className="world-bottom">
      <div className="world-location"><span className="live-dot" /> ZONE / {zones.find((zone) => zone.id === activeZone)?.label.toUpperCase()}</div>
      <button className="world-help-toggle" onClick={() => setHelpOpen((open) => !open)}>{helpOpen ? "MASQUER L'AIDE" : "COMMENT BOUGER"} <MoveUpRight size={13} /></button>
    </div>
    {helpOpen && <div className="world-help">
      <span className="help-key">W</span><span className="help-key">A</span><span className="help-key">S</span><span className="help-key">D</span><span>SE DÉPLACER</span><i /><span className="help-mouse">↔</span><span>REGARDER AUTOUR</span>
      <p>Survole le monde et clique pour prendre le contrôle de la caméra.</p>
    </div>}
    {activeProject && <div className="project-detail" role="dialog" aria-modal="true" aria-labelledby="project-detail-title">
      <button className="detail-close" onClick={() => setActiveProject(null)} aria-label="Fermer"><X size={18} /></button>
      <span className="detail-kicker">EXPERIMENT / {activeProject.number}</span>
      <h2 id="project-detail-title">{activeProject.title}<span>.</span></h2><p>{activeProject.description}</p>
      <div className="detail-footer"><span>{activeProject.type}</span><MoveUpRight size={17} /></div>
    </div>}
    <div className="world-caption"><span>AN EXPERIMENT IN SPACE</span><span>46° 19′ N / DIGITAL SPACE</span></div>
  </main>;
}
