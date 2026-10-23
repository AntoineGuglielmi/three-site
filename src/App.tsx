import { ArrowDownRight, ArrowUpRight, Github, Layers3, MoveUpRight } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, Sparkles, Text } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Group, Vector3 } from "three";

type ZoneId = "home" | "projects" | "about" | "contact";
type Zone = { id: ZoneId; number: string; label: string; eyebrow: string; position: [number, number, number]; lookAt: [number, number, number] };
type Project = { number: string; title: string; category: string; description: string; color: string; shape: "ring" | "crystal" | "cube" };
type Destination = { position: Vector3; lookAt: Vector3 };

const zones: Zone[] = [
  { id: "home", number: "01", label: "Accueil", eyebrow: "POINT DE DÉPART", position: [0, 1.6, 8], lookAt: [0, 1.8, -1.5] },
  { id: "projects", number: "02", label: "Projets", eyebrow: "GALERIE D'EXPÉRIMENTATIONS", position: [9, 1.8, 5.5], lookAt: [9, 1.9, -2.5] },
  { id: "about", number: "03", label: "À propos", eyebrow: "EN QUELQUES MOTS", position: [-9, 1.8, 5.5], lookAt: [-9, 1.9, -2.5] },
  { id: "contact", number: "04", label: "Contact", eyebrow: "LA SUITE, ENSEMBLE", position: [0, 1.8, -7], lookAt: [0, 1.9, -14] },
];
const projects: Project[] = [
  { number: "01", title: "Spatial interfaces", category: "CREATIVE DEVELOPMENT", description: "Des interfaces qui se vivent comme des lieux, plutôt que comme des pages.", color: "#a8a0e8", shape: "ring" },
  { number: "02", title: "Generative matter", category: "EXPERIMENT / WEBGL", description: "Des formes et des systèmes visuels qui émergent de règles simples.", color: "#82cbb9", shape: "crystal" },
  { number: "03", title: "Soft machines", category: "INTERACTION DESIGN", description: "Des objets numériques qui répondent au mouvement et à la curiosité.", color: "#e6ad9d", shape: "cube" },
];

function World({ destination, onArrive, activeProject, onSelectProject }: {
  destination: Destination | null; onArrive: () => void; activeProject: Project | null; onSelectProject: (project: Project | null) => void;
}) {
  const { camera } = useThree();
  const arrived = useRef(false);
  useFrame((_, delta) => {
    if (!destination) return;
    camera.position.lerp(destination.position, 1 - Math.exp(-delta * 1.65));
    camera.lookAt(destination.lookAt);
    if (camera.position.distanceTo(destination.position) < 0.08 && !arrived.current) {
      arrived.current = true;
      onArrive();
    }
  });
  useEffect(() => { if (destination) arrived.current = false; }, [destination]);

  return <>
    <color attach="background" args={["#e9edf4"]} />
    <fog attach="fog" args={["#e9edf4", 19, 46]} />
    <ambientLight intensity={1.35} />
    <hemisphereLight args={["#ffffff", "#c4c5d8", 1.7]} />
    <directionalLight position={[5, 10, 7]} intensity={2.2} color="#fffaf5" />
    <pointLight position={[0, 4, -1]} intensity={22} distance={22} color="#c2baf3" />
    <pointLight position={[10, 4, -4]} intensity={24} distance={18} color="#b2e1d5" />
    <pointLight position={[-10, 4, -4]} intensity={21} distance={18} color="#f0c9bb" />
    <pointLight position={[0, 4, -15]} intensity={22} distance={17} color="#c2d8ed" />
    <mesh><sphereGeometry args={[33, 48, 32]} /><meshBasicMaterial color="#c9d0e5" side={1} wireframe transparent opacity={0.1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, -5]}><planeGeometry args={[90, 90]} /><meshStandardMaterial color="#dfe4ef" roughness={0.9} metalness={0.04} /></mesh>
    <gridHelper args={[80, 64, "#c5c9dc", "#d2d6e4"]} position={[0, -0.12, -5]} />
    <Sparkles count={115} scale={[42, 16, 44]} size={1.8} speed={0.12} opacity={0.6} color="#ffffff" />
    <GlassArch position={[0, 0, -2]} color="#a8a0e8" />
    <GlassArch position={[9, 0, -3]} color="#82cbb9" />
    <GlassArch position={[-9, 0, -3]} color="#e6ad9d" />
    <GlassArch position={[0, 0, -14]} color="#a8c7e4" />
    <Float speed={0.7} rotationIntensity={0.06} floatIntensity={0.16}>
      <mesh position={[-3.5, 2.6, -1.5]} rotation={[0.2, 0.3, 0.1]}><torusKnotGeometry args={[0.72, 0.13, 120, 16, 2, 3]} /><meshPhysicalMaterial color="#a8a0e8" roughness={0.23} metalness={0.12} clearcoat={0.8} /></mesh>
    </Float>
    <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.2}>
      <mesh position={[4.1, 1.2, -4.5]}><icosahedronGeometry args={[0.68, 1]} /><meshPhysicalMaterial color="#a4d9ce" roughness={0.3} metalness={0.05} transmission={0.25} transparent opacity={0.8} /></mesh>
    </Float>
    <Text position={[0, 0.12, 1.1]} fontSize={0.13} letterSpacing={0.15} color="#8c8da7" anchorX="center">A SMALL WORLD, BUILT WITH CARE</Text>

    <Html position={[0, 1.8, -1.5]} center>
      <section className="world-panel hero-panel" aria-label="Accueil">
        <div className="panel-orbit orbit-one" /><div className="panel-orbit orbit-two" />
        <div className="panel-kicker"><span className="status-dot" /> FRONTEND DEVELOPER · CREATIVE EXPLORER</div>
        <h1>Making the web<br /><em>feel different.</em></h1>
        <p className="panel-lede">J'aime les interfaces qui ont quelque chose à raconter — dans leur structure, leurs interactions et jusque dans les détails qu'on ne remarque presque pas.</p>
        <div className="hero-actions">
          <button className="pill-button pill-primary" onClick={() => window.dispatchEvent(new CustomEvent("world:navigate", { detail: "projects" }))}>Explorer les projets <ArrowDownRight size={16} /></button>
          <span className="panel-note">UN PEU DE CODE, BEAUCOUP DE CURIOSITÉ</span>
        </div>
        <div className="hero-index"><span>01 / 04</span><span>VALENCE, FRANCE · EN LIGNE PARTOUT</span></div>
      </section>
    </Html>

    <Html position={[9, 1.9, -2.5]} center>
      <section className="world-panel projects-panel" aria-label="Projets mis en avant">
        <div className="panel-heading"><div><div className="panel-kicker">02 — GALERIE D'EXPÉRIMENTATIONS</div><h2>Quelques idées<br /><em>qui prennent forme.</em></h2></div><span className="heading-mark"><Layers3 size={21} /></span></div>
        <p className="panel-intro">Des explorations entre développement frontend, design d'interaction et matière numérique.</p>
        <div className="project-gallery">
          {projects.map((project) => <button className="gallery-card" key={project.number} onClick={() => onSelectProject(project)} style={{ "--project-color": project.color } as React.CSSProperties}>
            <span className="gallery-art">
              {project.shape === "ring" && <span className="art-ring" />}
              {project.shape === "crystal" && <span className="art-crystal" />}
              {project.shape === "cube" && <span className="art-cube" />}
              <span className="art-number">{project.number}</span><ArrowUpRight className="art-arrow" size={16} />
            </span>
            <span className="gallery-category">{project.category}</span><strong>{project.title}</strong><span className="gallery-description">{project.description}</span>
          </button>)}
        </div>
        <div className="panel-footnote"><span>UNE GALERIE EN MOUVEMENT</span><span>CLIQUER POUR APPROFONDIR ↗</span></div>
      </section>
    </Html>

    <Html position={[-9, 1.9, -2.5]} center>
      <section className="world-panel about-panel" aria-label="À propos">
        <div className="panel-kicker">03 — EN QUELQUES MOTS</div>
        <h2>Le fond compte.<br /><em>La sensation aussi.</em></h2>
        <p className="about-lede">Je suis développeur frontend, avec un faible pour React, TypeScript et les interfaces qui sortent gentiment du cadre.</p>
        <div className="about-divider" />
        <div className="principles">
          <div><span>01</span><strong>Des systèmes clairs</strong><p>Une architecture qui aide à avancer, pas à se battre contre le code.</p></div>
          <div><span>02</span><strong>Des détails sensibles</strong><p>Du mouvement, du rythme et des interactions qui ont une vraie raison d'être.</p></div>
          <div><span>03</span><strong>Du sens avant l'effet</strong><p>La technique au service d'une expérience, jamais l'inverse.</p></div>
        </div>
        <div className="tech-stack"><span>REACT</span><span>TYPESCRIPT</span><span>THREE.JS</span><span>ACCESSIBILITÉ</span></div>
      </section>
    </Html>

    <Html position={[0, 1.9, -14]} center>
      <section className="world-panel contact-panel" aria-label="Contact">
        <div className="contact-glow" /><div className="panel-kicker">04 — LA SUITE, ENSEMBLE</div>
        <h2>Une idée en tête ?<br /><em>Parlons-en.</em></h2>
        <p>Un projet singulier, une interface complexe ou simplement l'envie de faire les choses autrement : ma boîte mail est ouverte.</p>
        <a className="pill-button pill-primary" href="mailto:hello@antoine-g.com">Écrire un petit mot <MoveUpRight size={16} /></a>
        <div className="contact-links"><a href="https://github.com/AntoineGuglielmi" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14} /></a><a href="https://antoine-g.com" target="_blank" rel="noreferrer">Mon site <ArrowUpRight size={14} /></a></div>
      </section>
    </Html>

    {activeProject && <Html position={[9, 1.8, 1.4]} center>
      <section className="world-panel project-detail-panel" role="dialog" aria-modal="true" aria-label={activeProject.title}>
        <button className="detail-close" onClick={() => onSelectProject(null)} aria-label="Fermer">×</button>
        <div className="panel-kicker">EXPÉRIMENTATION / {activeProject.number}</div>
        <h2>{activeProject.title}<em>.</em></h2><p>{activeProject.description}</p><div className="detail-category">{activeProject.category}</div>
      </section>
    </Html>}
  </>;
}

function GlassArch({ position, color }: { position: [number, number, number]; color: string }) {
  const group = useRef<Group>(null);
  useFrame((state) => { if (group.current) group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.13 + position[0]) * 0.025; });
  return <group ref={group} position={position}>
    <mesh position={[0, 1.8, -0.15]}><boxGeometry args={[8.8, 5.8, 0.12]} /><meshPhysicalMaterial color={color} roughness={0.22} metalness={0.02} transmission={0.72} thickness={0.5} transparent opacity={0.25} side={2} /></mesh>
    <mesh position={[0, 1.8, -0.22]}><planeGeometry args={[8.65, 5.65]} /><meshBasicMaterial color={color} transparent opacity={0.07} side={2} /></mesh>
    <mesh position={[0, -0.02, 0.1]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[4.4, 4.55, 96]} /><meshBasicMaterial color={color} transparent opacity={0.45} side={2} /></mesh>
    <pointLight position={[0, 2.5, 1.2]} color={color} intensity={7} distance={10} />
  </group>;
}

export default function App() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [activeZone, setActiveZone] = useState<ZoneId>("home");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const goTo = useCallback((zoneId: ZoneId) => {
    const zone = zones.find((item) => item.id === zoneId);
    if (!zone) return;
    setActiveProject(null); setActiveZone(zone.id); setMenuOpen(false);
    setDestination({ position: new Vector3(...zone.position), lookAt: new Vector3(...zone.lookAt) });
  }, []);
  const handleArrive = useCallback(() => setDestination(null), []);
  useEffect(() => {
    const navigate = (event: Event) => { const detail = (event as CustomEvent<ZoneId>).detail; if (detail) goTo(detail); };
    window.addEventListener("world:navigate", navigate);
    return () => window.removeEventListener("world:navigate", navigate);
  }, [goTo]);
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 18) return;
      const index = zones.findIndex((zone) => zone.id === activeZone);
      const nextIndex = Math.max(0, Math.min(zones.length - 1, index + (event.deltaY > 0 ? 1 : -1)));
      if (nextIndex !== index) goTo(zones[nextIndex].id);
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [activeZone, goTo]);

  return <main className="world-shell">
    <div className="world-canvas" aria-label="Portfolio 3D explorable">
      <Canvas camera={{ position: zones[0].position, fov: 52 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}>
        <Suspense fallback={null}><World destination={destination} onArrive={handleArrive} activeProject={activeProject} onSelectProject={setActiveProject} /></Suspense>
      </Canvas>
    </div>
    <header className="site-topbar">
      <button className="brand" onClick={() => goTo("home")} aria-label="Retour à l'accueil"><span className="brand-symbol">a.</span><span>ANTOINE G.</span></button>
      <div className="topbar-center"><span className="status-dot" /> UN PORTFOLIO À EXPLORER</div>
      <a className="topbar-link" href="https://github.com/AntoineGuglielmi/three-site" target="_blank" rel="noreferrer">CODE SOURCE <Github size={14} /></a>
    </header>
    <nav className={"site-nav " + (menuOpen ? "nav-open" : "")} aria-label="Navigation principale">
      {zones.map((zone) => <button key={zone.id} className={activeZone === zone.id ? "is-active" : ""} onClick={() => goTo(zone.id)}><span>{zone.number}</span>{zone.label}<ArrowUpRight size={13} /></button>)}
    </nav>
    <div className="site-bottom"><span>UN ESPACE NUMÉRIQUE, EN QUATRE TEMPS</span><button onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "FERMER" : "NAVIGATION"} <span>{menuOpen ? "−" : "+"}</span></button></div>
    <div className="section-progress" aria-hidden="true"><span style={{ width: String(((zones.findIndex((zone) => zone.id === activeZone) + 1) / zones.length) * 100) + "%" }} /></div>
    <div className="world-caption"><span>{zones.find((zone) => zone.id === activeZone)?.eyebrow}</span><span>{zones.find((zone) => zone.id === activeZone)?.number} / 04</span></div>
  </main>;
}
