import { ArrowDownRight, ArrowUpRight, Github, MoveUpRight } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls, Sphere, TorusKnot } from "@react-three/drei";
import { Suspense, useState } from "react";

function Scene() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`scene ${hovered ? "scene--active" : ""}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      aria-label="Objet 3D interactif"
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 4, 5]} intensity={3.2} color="#dce7ff" />
        <pointLight position={[-4, -2, 1]} intensity={18} color="#8275ff" />
        <pointLight position={[3, -1, -2]} intensity={12} color="#72e7d2" />
        <Suspense fallback={null}>
          <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.55}>
            <TorusKnot args={[1.05, 0.32, 220, 32, 2, 5]} scale={hovered ? 1.08 : 1}>
              <MeshDistortMaterial
                color="#b8b1ff"
                roughness={0.22}
                metalness={0.68}
                distort={hovered ? 0.34 : 0.22}
                speed={2.1}
                envMapIntensity={1.4}
              />
            </TorusKnot>
            <Sphere args={[1.65, 48, 48]} scale={1.03}>
              <meshBasicMaterial color="#7f78ff" wireframe transparent opacity={0.09} />
            </Sphere>
          </Float>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.7}
          maxPolarAngle={Math.PI / 1.7}
          rotateSpeed={0.55}
        />
      </Canvas>
      <div className="scene-caption"><span className="live-dot" /> REAL-TIME RENDER / 001</div>
    </div>
  );
}

const projects = [
  { number: "01", title: "Spatial interface", type: "EXPERIMENT / WEBGL", year: "2026" },
  { number: "02", title: "Generative matter", type: "CREATIVE CODE", year: "2026" },
  { number: "03", title: "Soft machines", type: "INTERACTION DESIGN", year: "WIP" },
];

export default function App() {
  return (
    <main>
      <nav className="topbar">
        <a className="wordmark" href="#top" aria-label="Accueil"><span className="wordmark-mark">a.</span> ANTOINE G.</a>
        <span className="nav-status"><span className="live-dot" /> INDEPENDENT DEVELOPER <span className="status-year">/ 2026</span></span>
        <a className="nav-link" href="https://github.com/AntoineGuglielmi/three-site" target="_blank" rel="noreferrer">
          SOURCE <Github size={14} strokeWidth={1.8} />
        </a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> CODE AS A MATERIAL</p>
          <h1>Making the<br /><span>web feel</span> different.</h1>
          <p className="hero-description">
            Un terrain de jeu pour explorer ce qui se passe quand le code devient matière,
            mouvement et expérience.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#experiments">Explorer les expériences <ArrowDownRight size={16} /></a>
            <a className="text-link" href="https://github.com/AntoineGuglielmi" target="_blank" rel="noreferrer">Mon GitHub <ArrowUpRight size={14} /></a>
          </div>
          <div className="hero-meta">
            <div><span className="meta-label">FOCUS</span><span>Three.js · Creative dev</span></div>
            <div><span className="meta-label">MODE</span><span>Learning by making</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-orbit visual-orbit--one" />
          <div className="visual-orbit visual-orbit--two" />
          <div className="visual-cross visual-cross--one">+</div>
          <div className="visual-cross visual-cross--two">+</div>
          <Scene />
          <div className="coordinate coordinate--top">45° 11′ 00.2″ N</div>
          <div className="coordinate coordinate--bottom">MESH_001 <span>●</span> ACTIVE</div>
        </div>
        <div className="hero-index"><span>SCROLL TO EXPLORE</span><MoveUpRight size={13} /></div>
      </section>

      <section className="experiments" id="experiments">
        <div className="section-heading">
          <div><p className="eyebrow"><span className="eyebrow-line" /> THE PLAYGROUND</p><h2>Selected experiments<span className="heading-period">.</span></h2></div>
          <p className="section-note">Des idées en mouvement.<br />Certaines prennent forme, d’autres non.</p>
        </div>
        <div className="project-list">
          {projects.map((project) => (
            <a className="project-row" href="https://github.com/AntoineGuglielmi/three-site" key={project.number} target="_blank" rel="noreferrer">
              <span className="project-number">{project.number}</span>
              <span className="project-title">{project.title}</span>
              <span className="project-type">{project.type}</span>
              <span className="project-year">{project.year}</span>
              <span className="project-arrow"><ArrowUpRight size={17} /></span>
            </a>
          ))}
        </div>
      </section>

      <footer className="footer">
        <span>BUILT WITH CURIOSITY <span className="footer-star">✳</span> AND A LITTLE GPU</span>
        <a href="https://github.com/AntoineGuglielmi/three-site" target="_blank" rel="noreferrer">FOLLOW THE EXPERIMENT <ArrowUpRight size={13} /></a>
      </footer>
    </main>
  );
}
