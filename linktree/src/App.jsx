import { useEffect, useState } from "react";
import { carregar, TIPOS } from "./dados.js";
import { registrarClique } from "./cliques.js";

function dataCurta(iso) {
  const [a, m, d] = (iso || "").slice(0, 10).split("-");
  return d && m && a ? `${d}/${m}` : "";
}

function Cartao({ pub, selo }) {
  const { cor } = TIPOS[pub.tipo];
  return (
    <article className="cartao" style={{ "--tipo": cor }}>
      <a className="principal" href={pub.url} target="_blank" rel="noopener" onClick={() => registrarClique(pub.id)}>
        {pub.capa && <img className="capa" src={pub.capa} alt="" loading="lazy" onError={(e) => e.currentTarget.remove()} />}
        <span className="texto">
          <span className="meta">
            <span className="selo">{selo}</span>
            {pub.data && <span className="data">{dataCurta(pub.data)}</span>}
          </span>
          <span className="titulo">{pub.titulo}</span>
          {pub.chamada && <span className="chamada">{pub.chamada}</span>}
          {pub.prazo?.texto && <span className={pub.prazo.urgente ? "prazo urgente" : "prazo"}>{pub.prazo.texto}</span>}
        </span>
        <span className="seta" aria-hidden="true">↗</span>
      </a>
      {(pub.edital || pub.reel) && (
        <span className="extras">
          {pub.edital && (
            <a href={pub.edital} target="_blank" rel="noopener" onClick={() => registrarClique(pub.id)}>
              Edital oficial ↗
            </a>
          )}
          {pub.reel && (
            <a href={pub.reel} target="_blank" rel="noopener" onClick={() => registrarClique(pub.id)}>
              Ver o Reel ↗
            </a>
          )}
        </span>
      )}
    </article>
  );
}

export default function App() {
  const [estado, setEstado] = useState({ carregando: true });

  useEffect(() => {
    carregar()
      .then((dados) => setEstado({ dados }))
      .catch((erro) => setEstado({ erro }));
  }, []);

  const { dados, erro, carregando } = estado;
  const perfil = dados?.perfil ?? {};

  return (
    <main>
      <header>
        <img className="avatar" src={perfil.avatar ?? "./avatar.png"} alt="" />
        <h1>{perfil.nome ?? "EnfNews"}</h1>
        <p>Enfermagem em dia: revisão técnica, questões e editais.</p>
        {perfil.instagram && (
          <a className="perfil" href={perfil.instagram} target="_blank" rel="noopener">
            Seguir no Instagram
          </a>
        )}
      </header>

      {carregando && <p className="aviso">Carregando…</p>}
      {erro && <p className="aviso">Não foi possível carregar os links agora. Tente de novo em instantes.</p>}

      {dados && (
        <>
          {dados.destaques.length > 0 && (
            <section>
              <h2>Destaque</h2>
              {dados.destaques.map((p) => (
                <Cartao key={p.id} pub={p} selo={TIPOS[p.tipo].selo} />
              ))}
            </section>
          )}
          {dados.grupos.map((g) => (
            <section key={g.tipo}>
              <h2>{g.rotulo}</h2>
              {g.itens.map((p) => (
                <Cartao key={p.id} pub={p} selo={g.selo} />
              ))}
            </section>
          ))}
          {!dados.destaques.length && !dados.grupos.length && <p className="aviso">Nenhum link no ar no momento.</p>}
        </>
      )}

      <footer>
        Editais sempre com o link oficial da banca ou do órgão.
        {dados?.atualizado && (
          <>
            <br />
            Atualizado em {dataCurta(dados.atualizado)}.
          </>
        )}
      </footer>
    </main>
  );
}
