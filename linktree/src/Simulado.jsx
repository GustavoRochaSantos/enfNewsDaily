import { useEffect, useMemo, useState } from "react";
import { CARGOS, NIVEIS, ROTULO_NIVEL, assuntos, carregarBanco, cotas, rotuloFonte, sortearProva } from "./banco.js";
import "./simulado.css";

// Simulador de prova: apresenta o simulado, deixa escolher cargo, tamanho e assunto,
// sorteia na proporção 45/35/20 (fácil/média/difícil) e corrige no fim,
// com gabarito, explicação e fonte de cada questão.

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

function rotuloLetra(q, letra) {
  const certoErrado = q.alternativas.length === 2 && q.alternativas[0].letra === "C";
  return certoErrado ? (letra === "C" ? "Certo" : "Errado") : letra;
}

// A explicação no banco começa pelo gabarito ("C." ou "Certo."); aqui ele já aparece acima
function semGabarito(texto) {
  return texto.replace(/^(Certo|Errado|[A-E])\.\s*/, "");
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

function Apresentacao({ banco, onComecar }) {
  const [cargo, setCargo] = useState("");
  const [total, setTotal] = useState(15);
  const [assunto, setAssunto] = useState("");
  const lista = useMemo(() => assuntos(banco, cargo), [banco, cargo]);
  const disponiveis = banco.filter((q) => (!cargo || q.cargo === cargo) && (!assunto || q.assunto === assunto)).length;
  const c = cotas(total);
  const provas = new Set(banco.map((q) => `${q.banca}|${q.orgao}|${q.ano}|${q.cargo}`)).size;
  const bancas = [...new Set(banco.map((q) => q.banca))].join(", ");
  const anos = banco.map((q) => q.ano);
  const iniciar = () => onComecar({ total, cargo, assunto });

  return (
    <div className="s-intro">

      <section className="s-heroi">
        <p className="s-kicker">Simulado EnfNews</p>
        <h1>Treine com questões <em>reais</em> de concursos de enfermagem</h1>
        <p className="s-lead">
          Uma prova sorteada na hora, com questões de provas oficiais de {Math.min(...anos)} a {Math.max(...anos)}.
          Você responde no seu ritmo e, no fim, vê o gabarito definitivo e a explicação de cada questão.
        </p>
        <a className="s-botao" href="#montar">Iniciar simulado</a>
        <ul className="s-numeros">
          <li><b>{banco.length}</b><span>questões</span></li>
          <li><b>{provas}</b><span>provas oficiais</span></li>
          <li><b>{lista.length}</b><span>assuntos</span></li>
        </ul>
      </section>

      <section className="s-secao">
        <h2 className="s-titulo">Como funciona</h2>
        <ol className="s-passos">
          <li><b>Escolha</b><span>o cargo (enfermeiro ou técnico), o tamanho da prova e, se quiser, um assunto só.</span></li>
          <li><b>Responda</b><span>as questões sorteadas, na ordem que preferir. O relógio marca o tempo e o progresso fica salvo neste aparelho.</span></li>
          <li><b>Entregue</b><span>e veja sua nota, o acerto por nível de dificuldade e a correção completa.</span></li>
          <li><b>Aprenda</b><span>com a explicação de cada resposta e o link da prova e do gabarito oficiais.</span></li>
        </ol>
      </section>

      <section className="s-secao">
        <h2 className="s-titulo">De onde vêm as questões</h2>
        <div className="s-texto">
          <p>
            Todas saíram de provas oficiais publicadas pelas bancas ({bancas}), sempre com o <b>gabarito definitivo</b>,
            o que já considera os recursos. Cada questão mostra a banca, o órgão, o ano e o número na prova original.
          </p>
          <p>
            Questões anuladas ficam de fora, assim como as que cobram uma norma que mudou depois da prova
            (por exemplo, resoluções do Cofen revogadas ou protocolos atualizados). A ideia é você estudar só o que vale hoje.
          </p>
        </div>
      </section>

      <section className="s-secao">
        <h2 className="s-titulo">Fácil, média ou difícil</h2>
        <div className="s-texto">
          <p>
            Cada questão foi classificada por três critérios: quanto raciocínio exige, se cobra conteúdo básico ou detalhe de norma,
            e o quanto as alternativas se parecem. A prova sai sempre misturada: 45% fáceis, 35% médias e 20% difíceis.
          </p>
        </div>
        <div className="s-niveis">
          <div className="s-nivel facil"><span>Fácil</span><b>45%</b></div>
          <div className="s-nivel medio"><span>Média</span><b>35%</b></div>
          <div className="s-nivel dificil"><span>Difícil</span><b>20%</b></div>
        </div>
      </section>

      <section className="s-cartao" id="montar">
        <h2 className="s-subtitulo">Monte sua prova</h2>

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

        <button className="s-botao largo" disabled={!disponiveis} onClick={iniciar}>
          Iniciar simulado
        </button>
        <p className="s-nota">{disponiveis} questões disponíveis com esses filtros</p>
      </section>
    </div>
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

function Prova({ prova, setProva, onEntregar, onSair }) {
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

  const sair = () => {
    if (window.confirm("Sair deste simulado? As respostas dele serão apagadas.")) onSair();
  };
  const entregar = () => {
    const faltam = questoes.length - respondidas;
    if (faltam && !window.confirm(`Ainda faltam ${faltam} questões. Entregar mesmo assim?`)) return;
    onEntregar();
  };

  return (
    <div className="s-prova">
      <div className="s-barra">
        <button className="s-sair" onClick={sair}>Sair</button>
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

function Resultado({ prova, banco, onNovo }) {
  const { respostas, inicio, fim } = prova;
  const atuais = useMemo(() => new Map((banco ?? []).map((q) => [q.id, q])), [banco]);
  const questoes = prova.questoes.map((q) => atuais.get(q.id) ?? q);
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
            <div className="s-explicacao">
              <p className="s-resposta">
                Gabarito: <b>{rotuloLetra(q, q.gabarito)}</b>
                {marcada && marcada !== q.gabarito && <> · sua resposta: <b>{rotuloLetra(q, marcada)}</b></>}
                {!marcada && <> · você deixou em branco</>}
              </p>
              {q.explicacao && <p>{semGabarito(q.explicacao)}</p>}
            </div>
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
  // A prova (respostas e, depois de entregue, o resultado) fica salva neste aparelho
  // até a pessoa começar outra: recarregar ou fechar a aba não perde nada.
  const [prova, setProvaEstado] = useState(() => lerGuardado()?.questoes ? lerGuardado() : null);

  useEffect(() => {
    carregarBanco().then(setBanco).catch(setErro);
  }, []);

  const setProva = (p) => {
    setProvaEstado(p);
    guardar(p);
  };
  useEffect(() => { window.scrollTo({ top: 0 }); }, [prova?.atual, prova?.fim]);

  const comecar = (filtros) => {
    const s = sortearProva(banco, filtros);
    setProva({ ...s, filtros, respostas: {}, atual: 0, inicio: Date.now() });
  };

  return (
    <div className="sim">
      <Topo perfil={perfil} />
      <main className="s-corpo">
        {!prova && erro && <p className="s-aviso">Não foi possível carregar o banco de questões agora. Tente de novo em instantes.</p>}
        {!prova && !banco && !erro && <p className="s-aviso">Carregando questões…</p>}
        {!prova && banco && (
          <Apresentacao
            banco={banco}
            onComecar={comecar}
          />
        )}
        {prova && !prova.fim && <Prova prova={prova} setProva={setProva} onEntregar={() => setProva({ ...prova, fim: Date.now() })} onSair={() => setProva(null)} />}
        {prova?.fim && <Resultado prova={prova} banco={banco} onNovo={() => setProva(null)} />}
      </main>
      <footer className="s-rodape">
        Questões de provas oficiais, com banca, órgão, ano e número indicados. Gabarito definitivo divulgado pela banca.
        Conteúdo educativo; normas podem mudar depois da prova.
      </footer>
    </div>
  );
}
