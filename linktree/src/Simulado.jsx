import { useEffect, useMemo, useRef, useState } from "react";
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

        <div className="s-campo">
          <span id="rot-cargo">Cargo</span>
          <Seletor
            rotulo="rot-cargo"
            valor={cargo}
            onMudar={(v) => { setCargo(v); setAssunto(""); }}
            opcoes={[{ valor: "", texto: "Enfermeiro e Técnico" }, ...Object.entries(CARGOS).map(([id, nome]) => ({ valor: id, texto: nome }))]}
          />
        </div>

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

        <div className="s-campo">
          <span id="rot-assunto">Assunto</span>
          <Seletor
            rotulo="rot-assunto"
            valor={assunto}
            onMudar={setAssunto}
            opcoes={[{ valor: "", texto: "Todos os assuntos" }, ...lista.map(([a, n]) => ({ valor: a, texto: a, conta: n }))]}
          />
        </div>

        <button className="s-botao largo" disabled={!disponiveis} onClick={iniciar}>
          Iniciar simulado
        </button>
        <p className="s-nota">{disponiveis} questões disponíveis com esses filtros</p>
      </section>
    </div>
  );
}

function movimentoReduzido() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// Conta de 0 até o alvo em `ms` milissegundos (direto no alvo se o movimento for reduzido)
function useContagem(alvo, ms) {
  const [valor, setValor] = useState(() => (movimentoReduzido() ? alvo : 0));
  useEffect(() => {
    if (movimentoReduzido()) return setValor(alvo);
    let quadro;
    const comeco = performance.now();
    const passo = (t) => {
      const p = Math.min(1, (t - comeco) / ms);
      setValor(Math.round(alvo * (1 - (1 - p) ** 3)));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, ms]);
  return valor;
}

// Tela de passagem antes da prova e antes do resultado: as etapas acendem uma a uma,
// a barra enche e, no fim, chama onFim.
function Passagem({ tipo, kicker, titulo, pronto, etapas, children, onFim }) {
  const reduzido = movimentoReduzido();
  const [feitas, setFeitas] = useState(0);
  const terminou = feitas >= etapas.length;
  useEffect(() => {
    const t = setTimeout(
      () => (terminou ? onFim() : setFeitas((f) => f + 1)),
      terminou ? (reduzido ? 400 : 1100) : reduzido ? 300 : 800
    );
    return () => clearTimeout(t);
  }, [feitas]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={`s-passagem ${tipo}`} role="status" aria-live="polite">
      <div className="s-folhas" aria-hidden="true">
        <span /><span /><span>
          <i /><i /><i />
        </span>
      </div>
      <p className="s-kicker">{kicker}</p>
      <h1 key={terminou ? "pronto" : "titulo"}>{terminou ? pronto : titulo}</h1>
      {children}
      <ol className="s-etapas">
        {etapas.map((e, i) => (
          <li key={e} className={i < feitas ? "feita" : i === feitas ? "atual" : undefined}>{e}</li>
        ))}
      </ol>
      <div className="s-progresso"><span style={{ width: `${(feitas / etapas.length) * 100}%` }} /></div>
    </section>
  );
}

function Montando({ prova, onFim }) {
  const { real, filtros, questoes } = prova;
  const quem = filtros.cargo ? CARGOS[filtros.cargo] : "Enfermeiro e Técnico";
  const etapas = [
    `Separando questões de ${quem}${filtros.assunto ? ` sobre ${filtros.assunto}` : ""}`,
    `Sorteando ${real.facil} fáceis, ${real.medio} médias e ${real.dificil} difíceis`,
    `Misturando a ordem das ${questoes.length} questões`,
    "Acertando o relógio",
  ];
  return (
    <Passagem tipo="montar" kicker="Simulado" titulo="Montando sua prova" pronto="Tudo pronto. Boa prova!" etapas={etapas} onFim={onFim}>
      <p className="s-lead">Enquanto isso, ajeite-se, respire fundo e deixe papel e caneta por perto.</p>
    </Passagem>
  );
}

function Corrigindo({ prova, onFim }) {
  const { questoes, respostas } = prova;
  const acertos = questoes.filter((q) => respostas[q.id] === q.gabarito).length;
  const branco = questoes.filter((q) => !respostas[q.id]).length;
  const erros = questoes.length - acertos - branco;
  const ms = movimentoReduzido() ? 0 : 3000;
  const a = useContagem(acertos, ms);
  const e = useContagem(erros, ms);
  const etapas = [
    "Conferindo suas respostas com o gabarito definitivo",
    "Contando acertos e erros",
    "Separando o resultado por dificuldade",
    "Preparando a correção comentada",
  ];
  return (
    <Passagem tipo="corrigir" kicker="Correção" titulo="Corrigindo sua prova" pronto="Correção pronta!" etapas={etapas} onFim={onFim}>
      <div className="s-contagem">
        <div className="certo"><b>{a}</b><span>acertos</span></div>
        <div className="errado"><b>{e}</b><span>erros</span></div>
        {branco > 0 && <div><b>{branco}</b><span>em branco</span></div>}
      </div>
    </Passagem>
  );
}

function Questao({ q, n, total, marcada, onMarcar, entrada }) {
  return (
    <article className={`s-questao ${entrada ?? ""}`}>
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

// Select próprio (o nativo destoa do visual): lista com teclado, busca por letra e clique fora fecha
function Seletor({ rotulo, valor, opcoes, onMudar }) {
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(0);
  const caixa = useRef(null);
  const lista = useRef(null);
  const busca = useRef({ texto: "", ate: 0 });
  const escolhida = Math.max(0, opcoes.findIndex((o) => o.valor === valor));
  const id = `${rotulo}-lista`;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => caixa.current && !caixa.current.contains(e.target) && setAberto(false);
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto]);
  useEffect(() => {
    if (aberto) lista.current?.children[foco]?.scrollIntoView({ block: "nearest" });
  }, [aberto, foco]);

  const abrir = () => { setFoco(escolhida); setAberto(true); };
  const escolher = (i) => { onMudar(opcoes[i].valor); setAberto(false); };
  const tecla = (e) => {
    const ultimo = opcoes.length - 1;
    const mover = (i) => { e.preventDefault(); aberto ? setFoco(i) : abrir(); };
    if (e.key === "ArrowDown") mover(Math.min(ultimo, foco + 1));
    else if (e.key === "ArrowUp") mover(Math.max(0, foco - 1));
    else if (e.key === "Home" && aberto) mover(0);
    else if (e.key === "End" && aberto) mover(ultimo);
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aberto ? escolher(foco) : abrir(); }
    else if (e.key === "Escape" || e.key === "Tab") setAberto(false);
    else if (e.key.length === 1) {
      const agora = Date.now();
      const b = busca.current;
      b.texto = (agora < b.ate ? b.texto : "") + e.key.toLowerCase();
      b.ate = agora + 700;
      const i = opcoes.findIndex((o) => o.texto.toLowerCase().startsWith(b.texto));
      if (i >= 0) aberto ? setFoco(i) : onMudar(opcoes[i].valor);
    }
  };

  return (
    <div className={`s-seletor${aberto ? " aberto" : ""}`} ref={caixa}>
      <button
        type="button"
        className="s-seletor-botao"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={id}
        aria-labelledby={rotulo}
        aria-activedescendant={aberto ? `${id}-${foco}` : undefined}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={tecla}
      >
        <span>{opcoes[escolhida]?.texto}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7.5l5 5 5-5" /></svg>
      </button>
      {aberto && (
        <ul className="s-seletor-lista" role="listbox" id={id} aria-labelledby={rotulo} ref={lista}>
          {opcoes.map((o, i) => (
            <li
              key={o.valor || "todos"}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === escolhida}
              className={i === foco ? "foco" : undefined}
              onPointerEnter={() => setFoco(i)}
              onClick={() => escolher(i)}
            >
              <span className="s-seletor-marca" aria-hidden="true">{i === escolhida ? "✓" : ""}</span>
              <span className="s-seletor-texto">{o.texto}</span>
              {o.conta != null && <span className="s-seletor-conta">{o.conta}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
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
  // Direção da troca: avançar entra pela direita, voltar entra pela esquerda
  const anterior = useRef(atual);
  const entrada = useRef("entra");
  if (atual !== anterior.current) {
    entrada.current = atual > anterior.current ? "entra-dir" : "entra-esq";
    anterior.current = atual;
  }
  const respondidas = Object.keys(respostas).length;
  const ir = (i) => setProva({ ...prova, atual: i });
  const marcar = (letra) => setProva({ ...prova, respostas: { ...respostas, [q.id]: letra } });

  const [pergunta, setPergunta] = useState(null);
  const faltam = questoes.length - respondidas;
  const entregar = () => (faltam ? setPergunta("entregar") : onEntregar());

  return (
    <div className="s-prova">
      <div className="s-barra">
        <button className="s-botao pequeno contorno" onClick={() => setPergunta("desistir")}>Desistir</button>
        <span>{respondidas}/{questoes.length} respondidas</span>
        <span className="s-relogio">{tempo(Math.floor((agora - inicio) / 1000))}</span>
        <button className="s-botao pequeno" onClick={entregar}>Entregar</button>
      </div>
      {prova.aviso && <p className="s-aviso">{prova.aviso}</p>}
      <Questao key={q.id} entrada={entrada.current} q={q} n={atual + 1} total={questoes.length} marcada={respostas[q.id]} onMarcar={marcar} />
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
      {pergunta === "desistir" && (
        <Confirmar
          titulo="Desistir da prova?"
          texto={`Você respondeu ${respondidas} de ${questoes.length} questões. Se desistir, essas respostas são apagadas e você volta para o início do simulado.`}
          sim="Desistir"
          nao="Continuar a prova"
          perigo
          onSim={onSair}
          onNao={() => setPergunta(null)}
        />
      )}
      {pergunta === "entregar" && (
        <Confirmar
          titulo="Entregar a prova?"
          texto={`Ainda ${faltam === 1 ? "falta 1 questão" : `faltam ${faltam} questões`}. As que ficarem em branco contam como erro.`}
          sim="Entregar assim mesmo"
          nao="Voltar à prova"
          onSim={onEntregar}
          onNao={() => setPergunta(null)}
        />
      )}
    </div>
  );
}

function Confirmar({ titulo, texto, sim, nao, perigo, onSim, onNao }) {
  const ficar = useRef(null);
  const fechar = useRef(onNao);
  fechar.current = onNao;
  useEffect(() => {
    ficar.current?.focus();
    const esc = (e) => e.key === "Escape" && fechar.current();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  return (
    <div className="s-fundo" onClick={onNao}>
      <div className="s-dialogo" role="alertdialog" aria-modal="true" aria-labelledby="s-dialogo-titulo" onClick={(e) => e.stopPropagation()}>
        <h2 id="s-dialogo-titulo">{titulo}</h2>
        <p>{texto}</p>
        <div className="s-dialogo-botoes">
          <button ref={ficar} className="s-botao" onClick={onNao}>{nao}</button>
          <button className={`s-botao contorno${perigo ? " perigo" : ""}`} onClick={onSim}>{sim}</button>
        </div>
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
            <p className="s-fonte">{rotuloFonte(q)}</p>
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
  // Telas de passagem: só existem na hora (recarregar a página pula direto para a prova ou o resultado)
  const [montando, setMontando] = useState(null);
  const [corrigindo, setCorrigindo] = useState(false);

  useEffect(() => {
    carregarBanco().then(setBanco).catch(setErro);
  }, []);

  const setProva = (p) => {
    setProvaEstado(p);
    guardar(p);
  };
  useEffect(() => { window.scrollTo({ top: 0 }); }, [prova?.atual, prova?.fim, montando, corrigindo]);

  const comecar = (filtros) => setMontando({ ...sortearProva(banco, filtros), filtros, respostas: {}, atual: 0 });
  const entregar = () => {
    setCorrigindo(true);
    setProva({ ...prova, fim: Date.now() });
  };

  return (
    <div className="sim">
      <Topo perfil={perfil} />
      <main className="s-corpo">
        {!prova && !montando && erro && <p className="s-aviso">Não foi possível carregar o banco de questões agora. Tente de novo em instantes.</p>}
        {!prova && !banco && !erro && <p className="s-aviso">Carregando questões…</p>}
        {montando && <Montando prova={montando} onFim={() => { setProva({ ...montando, inicio: Date.now() }); setMontando(null); }} />}
        {!prova && !montando && banco && (
          <Apresentacao
            banco={banco}
            onComecar={comecar}
          />
        )}
        {prova && !prova.fim && <Prova prova={prova} setProva={setProva} onEntregar={entregar} onSair={() => setProva(null)} />}
        {prova?.fim && corrigindo && <Corrigindo prova={prova} onFim={() => setCorrigindo(false)} />}
        {prova?.fim && !corrigindo && <Resultado prova={prova} banco={banco} onNovo={() => setProva(null)} />}
      </main>
      <footer className="s-rodape">
        Questões de provas oficiais, com banca, órgão, ano e número indicados. Gabarito definitivo divulgado pela banca.
        Conteúdo educativo; normas podem mudar depois da prova.
      </footer>
    </div>
  );
}
