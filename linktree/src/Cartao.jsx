import { TIPOS } from "./dados.js";
import { registrarClique } from "./cliques.js";

export function dataCurta(iso) {
  const [a, m, d] = (iso || "").slice(0, 10).split("-");
  return d && m && a ? `${d}/${m}` : "";
}

export function Cartao({ pub, selo }) {
  const { cor } = TIPOS[pub.tipo];
  return (
    <article className="cartao" data-revelar style={{ "--tipo": cor }}>
      <a className="principal" data-onda href={pub.url} target="_blank" rel="noopener" onClick={() => registrarClique(pub.id)}>
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
