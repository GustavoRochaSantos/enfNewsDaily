// Função da Vercel: POST /api/clique com { "id": "<pasta do post>" } soma clicks + 1
// na publicação dentro do links.json do repositório.
//
// O token do GitHub fica só aqui, na variável GITHUB_TOKEN da Vercel (token fine-grained
// com acesso apenas a este repositório, permissão Contents: read and write). Nunca vai
// para o navegador.
const REPO = process.env.LINKS_REPO ?? "GustavoRochaSantos/enfNewsDaily";
const RAMO = process.env.LINKS_RAMO ?? "main";
const ARQUIVO = "links.json";
const API = `https://api.github.com/repos/${REPO}/contents/${ARQUIVO}`;
const TENTATIVAS = 4;

function github(url, init = {}) {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "enfnews-linktree",
      ...init.headers,
    },
  });
}

// Lê o arquivo, soma o clique e grava com o sha lido. Se alguém gravou no meio
// (outro clique ou o gerar_links.py), o GitHub responde 409 e tentamos de novo.
async function somarClique(id) {
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    const lido = await github(`${API}?ref=${RAMO}`);
    if (!lido.ok) throw new Error(`leitura: ${lido.status}`);
    const { content, sha } = await lido.json();
    const dados = JSON.parse(Buffer.from(content, "base64").toString("utf8"));

    const pub = dados.publicacoes?.find((p) => p.id === id);
    if (!pub || pub.ativo === false) return null;
    pub.clicks = (Number(pub.clicks) || 0) + 1;

    // mesmo formato do gerar_links.py (indent 2, sem escapar acentos, \n no fim)
    const texto = JSON.stringify(dados, null, 2) + "\n";
    const gravado = await github(API, {
      method: "PUT",
      body: JSON.stringify({
        message: `clique: ${id}`,
        content: Buffer.from(texto, "utf8").toString("base64"),
        sha,
        branch: RAMO,
      }),
    });
    if (gravado.ok) return pub.clicks;
    if (gravado.status !== 409 && gravado.status !== 422) throw new Error(`gravação: ${gravado.status}`);
    await new Promise((r) => setTimeout(r, 150 * tentativa + Math.random() * 200));
  }
  throw new Error("conflito: muitas gravações ao mesmo tempo");
}

export async function POST(request) {
  if (!process.env.GITHUB_TOKEN) return new Response("sem GITHUB_TOKEN", { status: 500 });

  let id;
  try {
    // a página manda text/plain (sendBeacon), então o corpo é lido como texto
    id = JSON.parse(await request.text())?.id;
  } catch {
    return new Response("corpo inválido", { status: 400 });
  }
  if (typeof id !== "string" || !/^[a-z0-9-]{1,120}$/.test(id)) {
    return new Response("id inválido", { status: 400 });
  }

  try {
    const clicks = await somarClique(id);
    if (clicks === null) return new Response("publicação não encontrada", { status: 404 });
    return Response.json({ id, clicks });
  } catch (erro) {
    console.error("clique", id, erro);
    return new Response("falha ao gravar", { status: 502 });
  }
}
