// Banco de questões do simulador (formato em ../banco/README.md).
//
// Como o links.json, o banco é lido direto do repositório (raw.githubusercontent):
// um lote novo de questões aparece no simulador sem precisar de novo deploy.
const BANCO_URL =
  import.meta.env.VITE_BANCO_URL ??
  "https://raw.githubusercontent.com/GustavoRochaSantos/enfNewsDaily/main/banco/questoes.json";

export const NIVEIS = ["facil", "medio", "dificil"];
export const ROTULO_NIVEL = { facil: "Fácil", medio: "Média", dificil: "Difícil" };

// Proporção padrão da prova: 45% fáceis, 35% médias, 20% difíceis (15 = 7/5/3)
export const PROPORCAO = { facil: 0.45, medio: 0.35, dificil: 0.2 };

export const CARGOS = {
  enfermeiro: "Enfermeiro",
  tecnico: "Técnico de Enfermagem",
};

function valida(q) {
  return (
    q && q.id && q.enunciado && Array.isArray(q.alternativas) && q.alternativas.length >= 2 &&
    q.alternativas.some((a) => a.letra === q.gabarito) && NIVEIS.includes(q.dificuldade) &&
    q.fonte?.prova_url && q.anulada !== true
  );
}

export async function carregarBanco() {
  const resp = await fetch(BANCO_URL, { cache: "no-store" });
  if (!resp.ok) throw new Error(`banco: HTTP ${resp.status}`);
  const json = await resp.json();
  return (json.questoes ?? []).filter(valida);
}

// Quantas questões de cada nível: maior resto, e o empate vai para a mais fácil
export function cotas(total, proporcao = PROPORCAO) {
  const brutas = NIVEIS.map((n) => total * proporcao[n]);
  const base = brutas.map(Math.floor);
  let falta = total - base.reduce((a, b) => a + b, 0);
  const ordem = NIVEIS.map((_, i) => i).sort((a, b) => brutas[b] - base[b] - (brutas[a] - base[a]) || a - b);
  for (const i of ordem) {
    if (falta-- <= 0) break;
    base[i] += 1;
  }
  return Object.fromEntries(NIVEIS.map((n, i) => [n, base[i]]));
}

function embaralhar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Vizinho mais próximo primeiro, para cobrir uma faixa que não tem questões suficientes
const VIZINHOS = { facil: ["medio", "dificil"], medio: ["facil", "dificil"], dificil: ["medio", "facil"] };

// Sorteia a prova respeitando as cotas. Devolve as questões já misturadas e um aviso
// se alguma faixa precisou ser completada com outra.
export function sortearProva(banco, { total, cargo, assunto }) {
  const filtradas = banco.filter(
    (q) => (!cargo || q.cargo === cargo) && (!assunto || q.assunto === assunto)
  );
  const pilhas = Object.fromEntries(NIVEIS.map((n) => [n, embaralhar(filtradas.filter((q) => q.dificuldade === n))]));
  const meta = cotas(total);
  const escolhidas = [];
  const faltas = {};

  for (const n of NIVEIS) {
    const pegou = pilhas[n].splice(0, meta[n]);
    escolhidas.push(...pegou);
    if (pegou.length < meta[n]) faltas[n] = meta[n] - pegou.length;
  }
  for (const [n, qtd] of Object.entries(faltas)) {
    let resta = qtd;
    for (const v of VIZINHOS[n]) {
      const pegou = pilhas[v].splice(0, resta);
      escolhidas.push(...pegou);
      resta -= pegou.length;
      if (!resta) break;
    }
  }

  const real = Object.fromEntries(NIVEIS.map((n) => [n, escolhidas.filter((q) => q.dificuldade === n).length]));
  const ajustou = NIVEIS.some((n) => real[n] !== meta[n]);
  return {
    questoes: embaralhar(escolhidas),
    meta,
    real,
    aviso:
      escolhidas.length < total
        ? `Só há ${escolhidas.length} questões com esses filtros; a prova saiu com ${escolhidas.length}.`
        : ajustou
          ? "Faltaram questões em alguma faixa de dificuldade; completamos com a faixa mais próxima."
          : null,
  };
}

export function assuntos(banco, cargo) {
  const contagem = new Map();
  for (const q of banco) if (!cargo || q.cargo === cargo) contagem.set(q.assunto, (contagem.get(q.assunto) ?? 0) + 1);
  return [...contagem].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
}

export function rotuloFonte(q) {
  return [q.banca, q.orgao, q.ano, CARGOS[q.cargo] ?? q.cargo, `questão ${q.numero}`].filter(Boolean).join(" · ");
}
