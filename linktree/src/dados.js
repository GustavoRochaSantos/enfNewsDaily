// Lê e normaliza o links.json (formato em ../LINKS.md). Campos desconhecidos são
// ignorados e os opcionais ganham valor padrão, então o formato pode crescer sem
// quebrar a página.
//
// O JSON é lido direto do repositório (raw.githubusercontent), então um post novo
// aparece aqui sem precisar de novo deploy da página.
const LINKS_URL =
  import.meta.env.VITE_LINKS_URL ??
  "https://raw.githubusercontent.com/GustavoRochaSantos/enfNewsDaily/main/links.json";

export const TIPOS = {
  concurso: { rotulo: "Editais abertos", selo: "Edital", cor: "#5B3FD1" },
  post: { rotulo: "Posts", selo: "Post", cor: "#1E6FD9" },
  quiz: { rotulo: "Questões de concurso", selo: "Questão", cor: "#0F7C78" },
};
const ORDEM_TIPOS = ["concurso", "post", "quiz"];
const DIA = 24 * 60 * 60 * 1000;

// Situação do concurso calculada na hora (o JSON não guarda "aberto", que ficaria velho)
function prazo(concurso, agora) {
  const fim = concurso?.inscricoes_ate ? new Date(concurso.inscricoes_ate) : null;
  if (!fim || Number.isNaN(fim.getTime())) return { aberto: true, texto: null, urgente: false };
  if (fim <= agora) return { aberto: false, texto: "Inscrições encerradas", urgente: false };
  const dias = Math.floor((fim - agora) / DIA);
  const quando = fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
  if (dias === 0) return { aberto: true, texto: "Inscrições encerram hoje", urgente: true };
  if (dias === 1) return { aberto: true, texto: "Inscrições encerram amanhã", urgente: true };
  return { aberto: true, texto: `Inscrições até ${quando}`, urgente: dias <= 3 };
}

export function normalizar(json, agora = new Date()) {
  const lista = Array.isArray(json?.publicacoes) ? json.publicacoes : [];
  const pubs = lista
    .filter((p) => p && p.id && p.titulo && p.url && p.ativo !== false)
    .map((p) => {
      const tipo = TIPOS[p.tipo] ? p.tipo : "post";
      return {
        id: p.id,
        tipo,
        titulo: p.titulo,
        chamada: p.chamada ?? "",
        data: p.data ?? "",
        capa: p.capa ?? null,
        url: p.url,
        reel: p.reel ?? null,
        destaque: Boolean(p.destaque),
        edital: tipo === "concurso" ? p.concurso?.edital ?? null : null,
        prazo: tipo === "concurso" ? prazo(p.concurso, agora) : null,
      };
    })
    // edital encerrado sai da página (mesma regra da bio: só o que está no ar)
    .filter((p) => !p.prazo || p.prazo.aberto)
    .sort((a, b) => Number(b.destaque) - Number(a.destaque) || b.data.localeCompare(a.data));

  const grupos = ORDEM_TIPOS.map((tipo) => ({
    tipo,
    ...TIPOS[tipo],
    itens: pubs.filter((p) => p.tipo === tipo && !p.destaque),
  })).filter((g) => g.itens.length);

  return {
    perfil: json?.perfil ?? {},
    atualizado: json?.atualizado_em ?? null,
    destaques: pubs.filter((p) => p.destaque),
    grupos,
  };
}

export async function carregar() {
  const resp = await fetch(LINKS_URL, { cache: "no-cache" });
  if (!resp.ok) throw new Error(`links.json: ${resp.status}`);
  return normalizar(await resp.json());
}
