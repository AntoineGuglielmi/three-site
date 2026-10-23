import { ArrowLeft, ArrowUpRight, Github, Mail, Send } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

type SectionId = "home" | "projects" | "cv" | "contact";

const sections: { id: SectionId; label: string; position: [number, number, number] }[] = [
  { id: "home", label: "Accueil", position: [0, 1.6, 0] },
  { id: "projects", label: "Projets mis en avant", position: [10, 1.6, 0] },
  { id: "cv", label: "Mon CV", position: [-10, 1.6, 0] },
  { id: "contact", label: "Contact", position: [0, 1.6, 12] },
];
const cvDestination: [number, number, number] = [-10, 1.6, 12];

function Space() {
  const points = useMemo(() => {
    const positions: number[] = [];
    let seed = 421;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 260; i += 1) {
      positions.push((random() - 0.5) * 64, (random() - 0.5) * 28, (random() - 0.5) * 70 - 8);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    // Gentle drift makes the environment feel alive without competing with the content.
    if (points.attributes.position) points.attributes.position.needsUpdate = time < 0;
  });

  return (
    <>
      <color attach="background" args={["#e9ebf3"]} />
      <fog attach="fog" args={["#e9ebf3", 20, 58]} />
      <ambientLight intensity={1.35} />
      <hemisphereLight args={["#ffffff", "#a9abc6", 1.1]} />
      <directionalLight position={[2, 7, 6]} intensity={1.7} />
      <pointLight position={[-8, 4, -4]} color="#b9b1f0" intensity={18} distance={26} />
      <points geometry={points}>
        <pointsMaterial color="#9b9bbd" size={0.035} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
      </points>
    </>
  );
}

function CameraJourney({ activeSection, cvDetail }: { activeSection: SectionId; cvDetail: boolean }) {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3(0, 1.6, 8));
  const targetLookAt = useRef(new Vector3(0, 1.6, 0));
  const currentLookAt = useRef(new Vector3(0, 1.6, 0));

  useEffect(() => {
    const section = sections.find(({ id }) => id === activeSection) ?? sections[0];
    const destination = activeSection === "cv" && cvDetail ? cvDestination : section.position;
    targetPosition.current.set(destination[0], destination[1], destination[2] + 8);
    targetLookAt.current.set(...destination);
  }, [activeSection, cvDetail]);

  useFrame((_, delta) => {
    const easing = 1 - Math.exp(-delta * 1.25);
    camera.position.lerp(targetPosition.current, easing);
    currentLookAt.current.lerp(targetLookAt.current, easing);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

function SectionPlaque({ section, cvDetail, onNavigate, onCvDetail }: {
  section: SectionId;
  cvDetail: boolean;
  onNavigate: (id: SectionId) => void;
  onCvDetail: (value: boolean) => void;
}) {
  if (section === "home") {
    return (
      <section className="glass-plaque hero-plaque" aria-label="Présentation">
        <h1>Antoine Guglielmi</h1>
        <p className="hero-role">Développeur frontend</p>
        <p className="hero-copy">Je conçois des interfaces web soignées, accessibles et robustes, avec une attention particulière portée à l’expérience et aux détails.</p>
        <div className="hero-actions">
          <button className="primary-link" onClick={() => onNavigate("projects")}>Voir mes projets <ArrowUpRight size={16} /></button>
          <button className="quiet-link" onClick={() => onNavigate("contact")}>Me contacter</button>
        </div>
      </section>
    );
  }

  if (section === "projects") {
    return (
      <section className="glass-plaque projects-plaque" aria-label="Projets mis en avant">
        <h2>Projets mis en avant</h2>
        <div className="project-list">
          <article><h3>Tresor</h3><p>Un outil de gestion de trésorerie pensé pour les associations.</p></article>
          <article><h3>LocProof</h3><p>Des références locatives, dans un parcours simple et fiable.</p></article>
          <article><h3>Polariis</h3><p>Explorer de nouvelles façons de rendre le web plus accessible.</p></article>
        </div>
      </section>
    );
  }

  if (section === "cv") {
    return (
      <section className="glass-plaque cv-plaque" aria-label={cvDetail ? "Espace CV" : "Introduction au CV"}>
        {cvDetail ? <>
          <button className="back-link" onClick={() => onCvDetail(false)}><ArrowLeft size={15} /> Retour à l’introduction</button>
          <h2>Mon CV</h2>
          <p className="plaque-copy">Cet espace accueillera les plaques détaillées de mon parcours. Nous pourrons les construire ensuite.</p>
        </> : <>
          <h2>Mon parcours</h2>
          <p className="plaque-copy">Développeur frontend orienté React et TypeScript, je m’intéresse à l’architecture, aux systèmes de design et à l’accessibilité.</p>
          <button className="primary-link" onClick={() => onCvDetail(true)}>Explorer mon CV <ArrowUpRight size={16} /></button>
        </>}
      </section>
    );
  }

  return (
    <section className="glass-plaque contact-plaque" aria-label="Formulaire de contact">
      <h2>Parlons de votre projet.</h2>
      <form className="contact-form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const subject = encodeURIComponent(`Message depuis antoine-g.com — ${String(form.get("name"))}`);
        const body = encodeURIComponent(`De : ${String(form.get("name"))}\\nEmail : ${String(form.get("email"))}\\n\\n${String(form.get("message"))}`);
        window.location.href = `mailto:hello@antoine-g.com?subject=${subject}&body=${body}`;
      }}>
        <label>Nom<input name="name" autoComplete="name" placeholder="Votre nom" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required /></label>
        <label>Message<textarea name="message" rows={3} placeholder="Quelques mots sur votre projet…" required /></label>
        <button className="primary-link" type="submit">Envoyer un message <Send size={15} /></button>
      </form>
      <a className="email-link" href="mailto:hello@antoine-g.com"><Mail size={15} /> hello@antoine-g.com</a>
    </section>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [cvDetail, setCvDetail] = useState(false);
  const navigateTo = (section: SectionId) => {
    if (section === activeSection && section !== "cv") return;
    setCvDetail(false);
    setActiveSection(section);
  };

  return (
    <main className={`site-shell section-${activeSection}`}>
      <div className="scene" aria-hidden="true">
        <Canvas camera={{ position: [0, 1.6, 8], fov: 42 }} dpr={[1, 1.5]}>
          <Space />
          <CameraJourney activeSection={activeSection} cvDetail={cvDetail} />
        </Canvas>
      </div>
      <header className="topbar">
        <button className="brand" onClick={() => navigateTo("home")} aria-label="Retour à l’accueil">antoine-g<span>.</span></button>
        <a className="source-link" href="https://github.com/AntoineGuglielmi" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17} /></a>
      </header>
      <div className="plaque-stage" key={activeSection + (cvDetail ? "-detail" : "")}>
        <SectionPlaque section={activeSection} cvDetail={cvDetail} onNavigate={navigateTo} onCvDetail={setCvDetail} />
      </div>
      <nav className="navigation-plaque" aria-label="Navigation principale">
        <p className="navigation-title">Navigation</p>
        {sections.map(({ id, label }) => (
          <button key={id} className={activeSection === id ? "nav-item active" : "nav-item"}
            aria-current={activeSection === id ? "page" : undefined} onClick={() => navigateTo(id)}>
            <span className="nav-dot" /><span>{label}</span>
            {activeSection === id && <span className="here-label">Ici</span>}
          </button>
        ))}
      </nav>
    </main>
  );
}
