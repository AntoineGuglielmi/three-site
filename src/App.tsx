import { ArrowUpRight, Github, Mail } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";

type SectionId = "home" | "projects" | "about";
type Section = {
  id: SectionId;
  label: string;
  position: [number, number, number];
  lookAt: [number, number, number];
};

const sections: Section[] = [
  { id: "home", label: "Accueil", position: [0, 1.5, 8], lookAt: [0, 1.7, -1] },
  { id: "projects", label: "Projets", position: [7, 1.5, 6], lookAt: [7, 1.7, -1] },
  { id: "about", label: "À propos", position: [-7, 1.5, 6], lookAt: [-7, 1.7, -1] },
];

function World({ activeSection }: { activeSection: SectionId }) {
  const { camera } = useThree();
  const lookAt = useRef(new Vector3(...sections[0].lookAt));

  useEffect(() => {
    const section = sections.find(({ id }) => id === activeSection) ?? sections[0];
    lookAt.current.set(...section.lookAt);
  }, [activeSection]);

  useFrame((_, delta) => {
    const section = sections.find(({ id }) => id === activeSection) ?? sections[0];
    camera.position.lerp(new Vector3(...section.position), 1 - Math.exp(-delta * 1.6));
    camera.lookAt(lookAt.current);
  });

  return (
    <>
      <color attach="background" args={["#edf0f6"]} />
      <fog attach="fog" args={["#edf0f6", 18, 38]} />
      <ambientLight intensity={1.8} />
      <hemisphereLight args={["#ffffff", "#c9c9dc", 1.1]} />
      <directionalLight position={[4, 8, 5]} intensity={1.6} color="#fffaf5" />
      <pointLight position={[0, 4, -2]} intensity={12} distance={18} color="#c8c0f2" />
      <pointLight position={[7, 4, -2]} intensity={10} distance={15} color="#c1e4da" />
      <pointLight position={[-7, 4, -2]} intensity={10} distance={15} color="#f1d4c9" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -3]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#e2e6f0" roughness={1} />
      </mesh>

      {sections.map((section) => (
        <Html key={section.id} position={[...section.lookAt.slice(0, 2), section.lookAt[2]] as [number, number, number]} center>
          {section.id === "home" && (
            <section className="content-panel home-panel" aria-label="Accueil">
              <p className="eyebrow"><span className="status-dot" /> Développeur frontend · React & TypeScript</p>
              <h1>Le web, avec<br /><em>un peu de relief.</em></h1>
              <p className="lede">J’aime concevoir des interfaces soignées, des systèmes clairs et des expériences qui ont quelque chose à raconter.</p>
              <button className="text-link" onClick={() => window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: "projects" }))}>
                Découvrir les projets <ArrowUpRight size={16} />
              </button>
            </section>
          )}
          {section.id === "projects" && (
            <section className="content-panel projects-panel" aria-label="Projets">
              <p className="eyebrow">Sélection</p>
              <h2>Des idées qui<br /><em>prennent forme.</em></h2>
              <div className="project-list">
                <article><h3>Tresor</h3><p>Un outil de gestion de trésorerie pensé pour les associations.</p><span>Next.js · TypeScript</span></article>
                <article><h3>LocProof</h3><p>Un service de références locatives conçu pour être simple et fiable.</p><span>React · Produit</span></article>
                <article><h3>Polariis</h3><p>Explorer de nouvelles façons de rendre le web plus accessible.</p><span>Accessibilité · IA</span></article>
              </div>
            </section>
          )}
          {section.id === "about" && (
            <section className="content-panel about-panel" aria-label="À propos">
              <p className="eyebrow">À propos</p>
              <h2>Du code solide.<br /><em>Une expérience sensible.</em></h2>
              <p className="lede">Développeur frontend orienté React et TypeScript, je m’intéresse autant à l’architecture et à l’accessibilité qu’aux détails d’interaction.</p>
              <div className="skills"><span>React</span><span>TypeScript</span><span>Next.js</span><span>Design systems</span><span>Accessibilité</span></div>
              <div className="contact-links">
                <a href="mailto:hello@antoine-g.com"><Mail size={15} /> Me contacter</a>
                <a href="https://github.com/AntoineGuglielmi" target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a>
              </div>
            </section>
          )}
        </Html>
      ))}
    </>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("home");

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const section = (event as CustomEvent<SectionId>).detail;
      if (sections.some(({ id }) => id === section)) setActiveSection(section);
    };
    window.addEventListener("portfolio:navigate", handleNavigate);
    return () => window.removeEventListener("portfolio:navigate", handleNavigate);
  }, []);

  return (
    <main className="site-shell">
      <div className="scene" aria-label="Portfolio en trois dimensions">
        <Canvas camera={{ position: sections[0].position, fov: 48 }} dpr={[1, 1.5]}>
          <Suspense fallback={null}><World activeSection={activeSection} /></Suspense>
        </Canvas>
      </div>

      <header className="topbar">
        <button className="brand" onClick={() => setActiveSection("home")} aria-label="Retour à l’accueil">antoine-g<span>.</span></button>
        <a className="source-link" href="https://github.com/AntoineGuglielmi/three-site" target="_blank" rel="noreferrer">Code source <Github size={15} /></a>
      </header>

      <nav className="section-nav" aria-label="Navigation principale">
        {sections.map(({ id, label }) => (
          <button key={id} className={activeSection === id ? "active" : ""} aria-current={activeSection === id ? "page" : undefined} onClick={() => setActiveSection(id)}>
            <span className="nav-indicator" />{label}<ArrowUpRight size={14} />
          </button>
        ))}
      </nav>

      <div className="bottom-note">Un portfolio à explorer, simplement.</div>
    </main>
  );
}
