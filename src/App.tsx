import { ArrowLeft, ArrowUpRight, Github, Mail, Send } from "lucide-react";
import { Html } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { Vector3 } from "three";

type SectionId = "home" | "projects" | "cv" | "contact";
type Section = {
  id: SectionId;
  label: string;
  position: [number, number, number];
};

const sections: Section[] = [
  { id: "home", label: "Accueil", position: [0, 1.6, 0] },
  { id: "projects", label: "Projets mis en avant", position: [10, 1.6, 0] },
  { id: "cv", label: "Mon CV", position: [-10, 1.6, 0] },
  { id: "contact", label: "Contact", position: [0, 1.6, 12] },
];
const cvDestination: [number, number, number] = [-10, 1.6, 12];

function GlassPlaque({
  section,
  onNavigate,
  cvDetail,
  onCvDetail,
}: {
  section: Section;
  onNavigate: (id: SectionId) => void;
  cvDetail: boolean;
  onCvDetail: (value: boolean) => void;
}) {
  const position: [number, number, number] = [...section.position];

  return (
    <Html position={position} center zIndexRange={[10, 0]}>
      {section.id === "home" && (
        <section className="glass-plaque hero-plaque" aria-label="Présentation">
          <h1>Antoine Guglielmi</h1>
          <p className="hero-role">Développeur frontend</p>
          <p className="hero-copy">
            Je conçois des interfaces web soignées, accessibles et robustes, avec une attention particulière portée à l’expérience et aux détails.
          </p>
          <div className="hero-actions">
            <button className="primary-link" onClick={() => onNavigate("projects")}>Voir mes projets <ArrowUpRight size={16} /></button>
            <button className="quiet-link" onClick={() => onNavigate("contact")}>Me contacter</button>
          </div>
        </section>
      )}

      {section.id === "projects" && (
        <section className="glass-plaque projects-plaque" aria-label="Projets mis en avant">
          <h2>Projets mis en avant</h2>
          <div className="project-list">
            <article>
              <h3>Tresor</h3>
              <p>Un outil de gestion de trésorerie pensé pour les associations.</p>
            </article>
            <article>
              <h3>LocProof</h3>
              <p>Des références locatives, dans un parcours simple et fiable.</p>
            </article>
            <article>
              <h3>Polariis</h3>
              <p>Explorer de nouvelles façons de rendre le web plus accessible.</p>
            </article>
          </div>
        </section>
      )}

      {section.id === "cv" && !cvDetail && (
        <section className="glass-plaque cv-plaque" aria-label="Introduction au CV">
          <h2>Mon parcours</h2>
          <p className="plaque-copy">
            Développeur frontend orienté React et TypeScript, je m’intéresse à l’architecture, aux systèmes de design et à l’accessibilité.
          </p>
          <button className="primary-link" onClick={() => onCvDetail(true)}>Explorer mon CV <ArrowUpRight size={16} /></button>
        </section>
      )}

      {section.id === "contact" && (
        <section className="glass-plaque contact-plaque" aria-label="Formulaire de contact">
          <h2>Parlons de votre projet.</h2>
          <form className="contact-form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const subject = encodeURIComponent(`Message depuis antoine-g.com — ${String(form.get("name"))}`);
            const body = encodeURIComponent(`De : ${String(form.get("name"))}\nEmail : ${String(form.get("email"))}\n\n${String(form.get("message"))}`);
            window.location.href = `mailto:hello@antoine-g.com?subject=${subject}&body=${body}`;
          }}>
            <label>Nom<input name="name" autoComplete="name" placeholder="Votre nom" required /></label>
            <label>Email<input name="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required /></label>
            <label>Message<textarea name="message" rows={3} placeholder="Quelques mots sur votre projet…" required /></label>
            <button className="primary-link" type="submit">Envoyer un message <Send size={15} /></button>
          </form>
          <a className="email-link" href="mailto:hello@antoine-g.com"><Mail size={15} /> hello@antoine-g.com</a>
        </section>
      )}
    </Html>
  );
}

function CvDestination({ onBack }: { onBack: () => void }) {
  return (
    <Html position={cvDestination} center zIndexRange={[10, 0]}>
      <section className="glass-plaque cv-plaque" aria-label="Espace CV">
        <button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Retour à l’introduction</button>
        <h2>Mon CV</h2>
        <p className="plaque-copy">Cet espace accueillera les plaques détaillées de mon parcours. Nous pourrons les construire ensuite.</p>
      </section>
    </Html>
  );
}

function World({
  activeSection,
  onNavigate,
  cvDetail,
  onCvDetail,
}: {
  activeSection: SectionId;
  onNavigate: (id: SectionId) => void;
  cvDetail: boolean;
  onCvDetail: (value: boolean) => void;
}) {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3(0, 1.6, 8));
  const targetLookAt = useRef(new Vector3(...sections[0].position));
  const currentLookAt = useRef(new Vector3(...sections[0].position));

  useEffect(() => {
    const section = sections.find(({ id }) => id === activeSection) ?? sections[0];
    const destination = activeSection === "cv" && cvDetail ? cvDestination : section.position;
    targetPosition.current.set(destination[0], destination[1], destination[2] + 8);
    targetLookAt.current.set(...destination);
  }, [activeSection, cvDetail]);

  useFrame((_, delta) => {
    const easing = 1 - Math.exp(-delta * 1.7);
    camera.position.lerp(targetPosition.current, easing);
    currentLookAt.current.lerp(targetLookAt.current, easing);
    camera.lookAt(currentLookAt.current);
  });

  return (
    <>
      <color attach="background" args={["#e9ebf3"]} />
      <fog attach="fog" args={["#e9ebf3", 24, 60]} />
      <ambientLight intensity={1.6} />
      <hemisphereLight args={["#ffffff", "#b8bad0", 1.1]} />
      <directionalLight position={[2, 5, 6]} intensity={1.4} />
      {sections.map((section) => (
        <GlassPlaque
          key={section.id}
          section={section}
          onNavigate={onNavigate}
          cvDetail={cvDetail}
          onCvDetail={onCvDetail}
        />
      ))}
      {activeSection === "cv" && cvDetail && <CvDestination onBack={() => onCvDetail(false)} />}
    </>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [cvDetail, setCvDetail] = useState(false);

  const navigateTo = (section: SectionId) => {
    setCvDetail(false);
    setActiveSection(section);
  };

  return (
    <main className="site-shell">
      <div className="scene" aria-label="Portfolio immersif en trois dimensions">
        <Canvas camera={{ position: [0, 1.6, 8], fov: 42 }} dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <World
              activeSection={activeSection}
              onNavigate={navigateTo}
              cvDetail={cvDetail}
              onCvDetail={setCvDetail}
            />
          </Suspense>
        </Canvas>
      </div>

      <header className="topbar">
        <button className="brand" onClick={() => navigateTo("home")} aria-label="Retour à l’accueil">antoine-g<span>.</span></button>
        <a className="source-link" href="https://github.com/AntoineGuglielmi" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17} /></a>
      </header>

      <nav className="navigation-plaque" aria-label="Navigation principale">
        <p className="navigation-title">Navigation</p>
        {sections.map(({ id, label }) => (
          <button
            key={id}
            className={activeSection === id ? "nav-item active" : "nav-item"}
            aria-current={activeSection === id ? "page" : undefined}
            onClick={() => navigateTo(id)}
          >
            <span className="nav-dot" />
            <span>{label}</span>
            {activeSection === id && <span className="here-label">Ici</span>}
          </button>
        ))}
      </nav>
    </main>
  );
}
