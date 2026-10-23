import { useEffect, useMemo, useState } from "react";
import { CARGOS, NIVEIS, ROTULO_NIVEL, assuntos, carregarBanco, cotas, rotuloFonte, sortearProva } from "./banco.js";
import "./simulado.css";

// Simulador de prova: escolhe cargo, tamanho e assunto, sorteia na proporção
// 45/35/20 (fácil/média/difícil) e corrige no fim, com a fonte de cada questão.

const TAMANHOS = [10, 15, 20, 30];
const GUARDA = "enfnews-simulado";

function lerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(GUARDA)) ?? null;
  } catch {
    return null;
  }
}
function guardar(valor) {
  try {
    if (valor) localStorage.setItem(GUARDA, JSON.stringify(valor));
    else localStorage.removeItem(GUARDA);
  } catch {
    /* sem armazenamento: o simulado só não sobrevive a um recarregar */
  }
}

function tempo(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Topo({ perfil }) {
  return (
    <nav className="s-topo">
      <a className="s-marca" href="/">
        <img src={perfil.avatar ?? "./avatar.png"} alt="" />
        <span>{perfil.nome ?? "EnfNews"}</span>
      </a>
      <span className="s-kicker">Simulado</span>
    </nav>
  );
}

function Configurar({ banco, onComecar, retomar, onRetomar }) {
  const [cargo, setCargo] = useState("");
  const [total, setTotal] = useState(15);
  const [assunto, setAssunto] = useState("");
  const lista = useMemo(() => assuntos(banco, cargo), [banco, cargo]);
  const disponiveis = banco.filter((q) => (!cargo || q.cargo === cargo) && (!assunto || q.assunto === assunto)).length;
  const c = cotas(total);

  return (
    <section className="s-cartao">
      <h1>Monte seu simulado</h1>
      <p className="s-lead">
        Questões reais de concursos de enfermagem, só com gabarito definitivo da banca.
        A prova mistura questões fáceis, médias e difíceis, e no fim você vê a correção e a fonte de cada questão.
      </p>

      {retomar && (
        <div className="s-retomar">
          <span>Você tem um simulado em andamento ({retomar.respondidas} de {retomar.total} respondidas).</span>
          <button className="s-botao pequeno" onClick={onRetomar}>Continuar</button>
        </div>
      )}

      <label className="s-campo">
        <span>Cargo</span>
        <select value={cargo} onChange={(e) => { setCargo(e.target.value); setAssunto(""); }}>
          <option value="">Enfermeiro e Técnico</option>
          {Object.entries(CARGOS).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
      </label>

      <div className="s-campo">
        <span>Número de questões</span>
        <div className="s-opcoes">
          {TAMANHOS.map((n) => (
            <button key={n} className={n === total ? "ativo" : undefined} onClick={() => setTotal(n)}>{n}</button>
          ))}
        </div>
        <small>
          {c.facil} fáceis, {c.medio} médias e {c.dificil} difíceis.
        </small>
      </div>

      <label className="s-campo">
        <span>Assunto</span>
        <select value={assunto} onChange={(e) => setAssunto(e.target.value)}>
          <option value="">Todos os assuntos</option>
          {lista.map(([a, n]) => <option key={a} value={a}>{a} ({n})</option>)}
        </select>
      </label>

      <button className="s-botao" disabled={!disponiveis} onClick={() => onComecar({ total, cargo, assunto })}>
        Começar simulado
      </button>
      <p className="s-nota">{banco.length} questões no banco · {disponiveis} com esses filtros</p>
    </section>
  );
}

function Questao({ q, n, total, marcada, onMarcar }) {
  return (
    <article className="s-questao">
      <header>
        <span className="s-num">Questão {n} de {total}</span>
        <span className="s-assunto">{q.assunto}</span>
      </header>
      {q.texto_base && <blockquote className="s-texto-base">{q.texto_base}</blockquote>}
      <p className="s-enunciado">{q.enunciado}</p>
      <ol className="s-alternativas">
        {q.alternativas.map((a) => (
          <li key={a.letra}>
            <button className={marcada === a.letra ? "marcada" : undefined} onClick={() => onMarcar(a.letra)}>
              <b>{a.letra}</b>
              <span>{a.texto}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="s-fonte">{rotuloFonte(q)}</p>
    </article>
  );
}

function Prova({ prova, setProva, onEntregar }) {
  const { questoes, respostas, atual, inicio } = prova;
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const q = questoes[atual];
  const respondidas = Object.keys(respostas).length;
  const ir = (i) => setProva({ ...prova, atual: i });
  const marcar = (letra) => setProva({ ...prova, respostas: { ...respostas, [q.id]: letra } });

  const entregar = () => {
    const faltam = questoes.length - respondidas;
    if (faltam && !window.confirm(`Ainda faltam ${faltam} questões. Entregar mesmo assim?`)) return;
    onEntregar();
  };

  return (
    <div className="s-prova">
      <div className="s-barra">
        <span>{respondidas}/{questoes.length} respondidas</span>
        <span className="s-relogio">{tempo(Math.floor((agora - inicio) / 1000))}</span>
        <button className="s-botao pequeno" onClick={entregar}>Entregar</button>
      </div>
      {prova.aviso && <p className="s-aviso">{prova.aviso}</p>}
      <Questao q={q} n={atual + 1} total={questoes.length} marcada={respostas[q.id]} onMarcar={marcar} />
      <div className="s-navegar">
        <button className="s-botao contorno" disabled={atual === 0} onClick={() => ir(atual - 1)}>← Anterior</button>
        {atual < questoes.length - 1
          ? <button className="s-botao" onClick={() => ir(atual + 1)}>Próxima →</button>
          : <button className="s-botao" onClick={entregar}>Entregar prova</button>}
      </div>
      <div className="s-mapa" aria-label="Ir para a questão">
        {questoes.map((x, i) => (
          <button key={x.id} className={[i === atual && "atual", respostas[x.id] && "feita"].filter(Boolean).join(" ") || undefined} onClick={() => ir(i)}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function Resultado({ prova, onNovo }) {
  const { questoes, respostas, inicio, fim } = prova;
  const acertou = (q) => respostas[q.id] === q.gabarito;
  const acertos = questoes.filter(acertou).length;
  const pct = Math.round((acertos / questoes.length) * 100);
  const porNivel = NIVEIS.map((n) => {
    const qs = questoes.filter((q) => q.dificuldade === n);
    return { n, total: qs.length, certas: qs.filter(acertou).length };
  }).filter((x) => x.total);

  return (
    <div className="s-resultado">
      <section className="s-cartao s-placar">
        <p className="s-kicker">Resultado</p>
        <h1>{acertos} de {questoes.length} <em>({pct}%)</em></h1>
        <p className="s-lead">Tempo de prova: {tempo(Math.floor((fim - inicio) / 1000))}</p>
        <div className="s-niveis">
          {porNivel.map((x) => (
            <div key={x.n} className={`s-nivel ${x.n}`}>
              <span>{ROTULO_NIVEL[x.n]}</span>
              <b>{x.certas}/{x.total}</b>
            </div>
          ))}
        </div>
        <button className="s-botao" onClick={onNovo}>Fazer outro simulado</button>
      </section>

      <h2 className="s-titulo">Correção</h2>
      {questoes.map((q, i) => {
        const marcada = respostas[q.id];
        return (
          <article key={q.id} className={`s-questao corrigida ${acertou(q) ? "certa" : "errada"}`}>
            <header>
              <span className="s-num">Questão {i + 1} · {acertou(q) ? "acertou" : marcada ? "errou" : "em branco"}</span>
              <span className={`s-selo ${q.dificuldade}`}>{ROTULO_NIVEL[q.dificuldade]}</span>
            </header>
            {q.texto_base && <blockquote className="s-texto-base">{q.texto_base}</blockquote>}
            <p className="s-enunciado">{q.enunciado}</p>
            <ol className="s-alternativas">
              {q.alternativas.map((a) => (
                <li key={a.letra}>
                  <div className={[a.letra === q.gabarito && "gabarito", a.letra === marcada && a.letra !== q.gabarito && "errada"].filter(Boolean).join(" ") || undefined}>
                    <b>{a.letra}</b>
                    <span>{a.texto}</span>
                  </div>
                </li>
              ))}
            </ol>
            {q.motivo_dificuldade && <p className="s-motivo">Por que é {ROTULO_NIVEL[q.dificuldade].toLowerCase()}: {q.motivo_dificuldade}</p>}
            <p className="s-fonte">
              {rotuloFonte(q)} ·{" "}
              <a href={q.fonte.prova_url} target="_blank" rel="noopener">prova</a>
              {q.fonte.gabarito_url && <> · <a href={q.fonte.gabarito_url} target="_blank" rel="noopener">gabarito definitivo</a></>}
            </p>
          </article>
        );
      })}
    </div>
  );
}

export default function Simulado({ perfil }) {
  const [banco, setBanco] = useState(null);
  const [erro, setErro] = useState(null);
  const [prova, setProvaEstado] = useState(null);
  const guardado = prova ? null : lerGuardado();

  useEffect(() => {
    carregarBanco().then(setBanco).catch(setErro);
  }, []);

  const setProva = (p) => {
    setProvaEstado(p);
    guardar(p && !p.fim ? p : null);
  };
  useEffect(() => window.scrollTo({ top: 0 }), [prova?.atual, prova?.fim]);

  const comecar = (filtros) => {
    const s = sortearProva(banco, filtros);
    setProva({ ...s, filtros, respostas: {}, atual: 0, inicio: Date.now() });
  };

  return (
    <div className="sim">
      <Topo perfil={perfil} />
      <main className="s-corpo">
        {erro && <p className="s-aviso">Não foi possível carregar o banco de questões agora. Tente de novo em instantes.</p>}
        {!banco && !erro && <p className="s-aviso">Carregando questões…</p>}
        {banco && !prova && (
          <Configurar
            banco={banco}
            onComecar={comecar}
            retomar={guardado && { total: guardado.questoes.length, respondidas: Object.keys(guardado.respostas).length }}
            onRetomar={() => setProvaEstado(guardado)}
          />
        )}
        {prova && !prova.fim && <Prova prova={prova} setProva={setProva} onEntregar={() => setProva({ ...prova, fim: Date.now() })} />}
        {prova?.fim && <Resultado prova={prova} onNovo={() => setProva(null)} />}
      </main>
      <footer className="s-rodape">
        Questões de provas oficiais, com banca, órgão, ano e número indicados. Gabarito definitivo divulgado pela banca.
        Conteúdo educativo; normas podem mudar depois da prova.
      </footer>
    </div>
  );
}
