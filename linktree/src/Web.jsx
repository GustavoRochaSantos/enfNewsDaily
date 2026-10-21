import { registrarClique } from "./cliques.js";
import { dataCurta } from "./Cartao.jsx";
import { useOnda, useRevelar, useRolou, useSecaoAtiva } from "./animacoes.js";
import "./web.css";

// Computador: landing do EnfNews, com vitrine das capas e os editais em destaque

const PILARES = [
  { n: "01", titulo: "Post do dia", texto: "Um tema técnico por dia, em carrossel, com a fonte oficial citada no fim." },
  { n: "02", titulo: "Questão de concurso", texto: "Questões de provas reais de enfermagem, com a alternativa certa explicada." },
  { n: "03", titulo: "Editais abertos", texto: "Vagas de técnico e enfermeiro, sempre com o link da banca ou do órgão." },
];

function Capa({ pub, i }) {
  return (
    <a className="w-capa" data-revelar style={{ "--i": i % 4 }} href={pub.url} target="_blank" rel="noopener" onClick={() => registrarClique(pub.id)}>
      <span className="w-capa-img">
        {pub.capa && <img src={pub.capa} alt="" loading="lazy" onError={(e) => e.currentTarget.remove()} />}
      </span>
      <span className="w-capa-meta">
        {pub.editoria && <span className="w-editoria">{pub.editoria}</span>}
        <span className="w-data">{dataCurta(pub.data)}</span>
      </span>
      <span className="w-capa-titulo">{pub.titulo}</span>
    </a>
  );
}

function Edital({ pub, i }) {
  const f = pub.ficha ?? {};
  const local = [f.orgao, f.uf].filter(Boolean).join(" · ");
  return (
    <article className="w-edital" data-revelar style={{ "--i": i }}>
      {pub.capa && <img className="w-edital-capa" src={pub.capa} alt="" loading="lazy" onError={(e) => e.currentTarget.remove()} />}
      <div className="w-edital-corpo">
        {pub.prazo?.texto && <span className={pub.prazo.urgente ? "w-prazo urgente" : "w-prazo"}>{pub.prazo.texto}</span>}
        <h3>{pub.titulo}</h3>
        {local && <p className="w-local">{local}</p>}
        {pub.subtitulo && <p className="w-sub">{pub.subtitulo}</p>}
        <dl>
          {f.vagas && (<div><dt>Vagas</dt><dd>{f.vagas}</dd></div>)}
          {f.banca && (<div><dt>Banca</dt><dd>{f.banca}</dd></div>)}
        </dl>
        <div className="w-acoes">
          {pub.edital && (
            <a className="w-botao" data-onda href={pub.edital} target="_blank" rel="noopener" onClick={() => registrarClique(pub.id)}>
              Edital oficial ↗
            </a>
          )}
          <a className="w-link" href={pub.url} target="_blank" rel="noopener" onClick={() => registrarClique(pub.id)}>
            Ver o post
          </a>
        </div>
      </div>
    </article>
  );
}

export default function Web({ dados, erro, perfil, arroba }) {
  const todas = dados?.todas ?? [];
  const editais = todas.filter((p) => p.tipo === "concurso");
  const posts = todas.filter((p) => p.tipo === "post");
  const questoes = todas.filter((p) => p.tipo === "quiz");
  const vitrine = todas.filter((p) => p.capa && p.tipo !== "concurso").slice(0, 3);
  const secoes = [editais.length && "editais", posts.length && "posts", questoes.length && "questoes"].filter(Boolean);

  useOnda();
  useRevelar(dados);
  const rolou = useRolou();
  const ativa = useSecaoAtiva(secoes, dados);
  const menu = (id) => (ativa === id ? "ativo" : undefined);

  return (
    <div className="web">
      <nav className={rolou ? "w-nav rolou" : "w-nav"}>
        <a className="w-marca" href="#topo">
          <img src={perfil.avatar ?? "./avatar.png"} alt="" />
          <span>{perfil.nome ?? "EnfNews"}</span>
        </a>
        <span className="w-menu">
          {editais.length > 0 && <a href="#editais" className={menu("editais")}>Editais</a>}
          {posts.length > 0 && <a href="#posts" className={menu("posts")}>Posts</a>}
          {questoes.length > 0 && <a href="#questoes" className={menu("questoes")}>Questões</a>}
          {perfil.instagram && (
            <a className="w-botao pequeno" data-onda href={perfil.instagram} target="_blank" rel="noopener">
              Seguir {arroba ? `@${arroba}` : "no Instagram"}
            </a>
          )}
        </span>
      </nav>

      <header className="w-hero" id="topo">
        <div className="w-hero-texto">
          <p className="w-kicker">Enfermagem · revisão técnica · concursos</p>
          <h1>Enfermagem em dia, <em>sem achismo.</em></h1>
          <p className="w-lead">
            Conteúdo técnico para técnicos e enfermeiros revisarem a prática e se prepararem para concursos.
            Cada post é conferido em fonte oficial (Ministério da Saúde, Anvisa, Cofen, diretrizes das sociedades)
            antes de ir ao ar.
          </p>
          <div className="w-acoes">
            {perfil.instagram && (
              <a className="w-botao" data-onda href={perfil.instagram} target="_blank" rel="noopener">Seguir no Instagram</a>
            )}
            {editais.length > 0 && <a className="w-botao contorno" data-onda href="#editais">Ver editais abertos</a>}
          </div>
        </div>
        <div className={vitrine.length ? "w-leque pronto" : "w-leque"} aria-hidden="true">
          {vitrine.map((p, i) => (
            <img key={p.id} className={`w-leque-${i}`} src={p.capa} alt="" />
          ))}
        </div>
      </header>

      <section className="w-pilares">
        {PILARES.map((p, i) => (
          <div key={p.n} data-revelar style={{ "--i": i }}>
            <span className="w-num">{p.n}</span>
            <h3>{p.titulo}</h3>
            <p>{p.texto}</p>
          </div>
        ))}
      </section>

      {erro && <p className="w-aviso">Não foi possível carregar as publicações agora. Tente de novo em instantes.</p>}

      {editais.length > 0 && (
        <section className="w-secao" id="editais">
          <div className="w-titulo-secao" data-revelar>
            <h2>Editais abertos</h2>
            <p>Só o que está com inscrição aberta, sempre com o link oficial.</p>
          </div>
          <div className="w-editais">
            {editais.map((p, i) => <Edital key={p.id} pub={p} i={i} />)}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="w-secao" id="posts">
          <div className="w-titulo-secao" data-revelar>
            <h2>Últimos posts</h2>
            <p>Clique na capa para abrir o carrossel no Instagram.</p>
          </div>
          <div className="w-grade">
            {posts.map((p, i) => <Capa key={p.id} pub={p} i={i} />)}
          </div>
        </section>
      )}

      {questoes.length > 0 && (
        <section className="w-secao" id="questoes">
          <div className="w-titulo-secao" data-revelar>
            <h2>Questões de concurso</h2>
            <p>Teste o que você sabe antes de ver o gabarito.</p>
          </div>
          <div className="w-grade">
            {questoes.map((p, i) => <Capa key={p.id} pub={p} i={i} />)}
          </div>
        </section>
      )}

      <footer className="w-rodape">
        <span className="w-marca">
          <img src={perfil.avatar ?? "./avatar.png"} alt="" />
          <span>{perfil.nome ?? "EnfNews"}</span>
        </span>
        <p>
          Conteúdo educativo para profissionais de enfermagem; não substitui protocolos da sua instituição.
          {dados?.atualizado && <> Atualizado em {dataCurta(dados.atualizado)}.</>}
        </p>
      </footer>
    </div>
  );
}
