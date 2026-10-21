import { TIPOS } from "./dados.js";
import { Cartao, dataCurta } from "./Cartao.jsx";
import { useOnda, useRevelar } from "./animacoes.js";

// Celular: página de links enxuta, para quem chega pela bio do Instagram
export default function Links({ dados, erro, perfil }) {
  useOnda();
  useRevelar(dados);

  return (
    <main className="pagina">
      <header>
        <img className="avatar" src={perfil.avatar ?? "./avatar.png"} alt="" />
        <h1>{perfil.nome ?? "EnfNews"}</h1>
        <p>Enfermagem em dia: revisão técnica, questões e editais.</p>
        {perfil.instagram && (
          <a className="perfil" data-onda href={perfil.instagram} target="_blank" rel="noopener">
            Seguir no Instagram
          </a>
        )}
      </header>

      {!dados && !erro && <p className="aviso">Carregando…</p>}
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
