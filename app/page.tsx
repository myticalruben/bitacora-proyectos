import { ProjectList } from "../components/project-list";
export default function Home() {
  return;
  <>
    <section className="hero">
      <div>
        <div className="eyebrow">
          <span className="dot" /> Rubén Alexander · En construcción constante
        </div>
        <h1>
          Aprender.
          <br />
          Construir.
          <br />
          <em>Compartir.</em>
        </h1>
        <p className="intro">
          Una bitácora de los proyectos que voy desarrollando. Código,
          infraestructura y aprendizajes de mi camino en Ingeniería Informática.
        </p>
        <a className="cta" href="/proyectos.html">
          Explorar la bitácora <span>↓</span>
        </a>
      </div>
      <div
        className="art"
        aria-label="Ilustración de una terminal de desarrollo"
      >
        <div className="orbit" />
        <div className="terminal">
          <div className="termbar">
            <b>●●●</b> ruben@dev: ~/proyectos
          </div>
          <div className="code">
            <span>❯</span> iniciar nuevo_proyecto
            <br />↳ una idea, muchas preguntas
            <br />↳ probar · romper · aprender
            <br />
            <span>✓</span> un paso más que ayer<span> ▋</span>
          </div>
        </div>
        <div className="tag">&lt; hecho para aprender /&gt;</div>
      </div>
    </section>
    <div className="strip">
      <span>EL PROCESO TAMBIÉN MERECE CONTARSE</span>
      <strong>Software / Linux / Infraestructura</strong>
      <span>DESDE LA IDEA HASTA EL CÓDIGO ↗</span>
    </div>
    <section id="proyectos">
      <div className="sectiontop">
        <h2>Proyectos y aprendizajes</h2>
        <a href="/proyectos.html">Ver todos ↗</a>
      </div>
      <ProjectList featured />
    </section>
    <section className="about" id="sobre-mi">
      <div>
        <div className="eyebrow">02 / Detrás del código</div>
        <h2>Hola, soy Rubén.</h2>
        <div className="avatar">ra.</div>
        <a
          href="https://github.com/myticalruben"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mi código en GitHub ↗
        </a>
      </div>
      <div>
        <p>
          Estudio Ingeniería Informática y este es mi espacio para documentar lo
          que voy construyendo: las ideas, las decisiones y lo que aprendo en el
          camino.
        </p>
        <p>
          Me interesan el desarrollo de software, las redes y la
          infraestructura. Aquí, cada proyecto tiene espacio para contar su
          propia historia.
        </p>
        <div className="topics">
          <span>Desarrollo web</span>
          <span>Linux</span>
          <span>Redes</span>
          <span>Automatización</span>
        </div>
      </div>
    </section>
  </>;
}
