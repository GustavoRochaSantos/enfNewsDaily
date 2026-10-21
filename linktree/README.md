# Página de links (linktree) do EnfNews

Página em React (Vite). No celular (até 959px) é uma página de links no estilo Linktree
(`src/Links.jsx`); no computador vira a landing do EnfNews (`src/Web.jsx`, `src/web.css`). Lê o `links.json` da raiz do repositório
(formato em `../LINKS.md`) direto do raw.githubusercontent, então um post novo aparece
sozinho, sem novo deploy.

- Agrupa em: editais abertos, posts e questões de concurso. `destaque: true` fixa no topo
  e `ativo: false` esconde.
- Edital com `inscricoes_ate` no passado sai da página; faltando até 3 dias, o prazo fica em vermelho.
- Cada cartão de edital tem também o botão "Edital oficial" (link da banca).

## Rodar

```bash
cd linktree
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

## Publicar (Vercel)

1. Na Vercel: Add New → Project → importe `GustavoRochaSantos/enfNewsDaily`.
2. **Root Directory: `linktree`** (o framework Vite é detectado sozinho).
3. Em Settings → Environment Variables, crie `GITHUB_TOKEN` (veja abaixo).
4. Em Settings → Domains, adicione o seu domínio e siga as instruções de DNS.

O `vercel.json` só refaz o deploy quando algo muda em `linktree/`: os commits de post,
do links.json e dos cliques não geram deploy novo.

## Contador de cliques

Cada clique chama `registrarClique(id)` (`src/cliques.js`), que manda `{ "id": ... }` para
`/api/clique`. A função `api/clique.js` roda na Vercel, lê o `links.json` pela API do
GitHub, soma `clicks + 1` naquela publicação e grava um commit `clique: <id>`. Se duas
gravações se cruzarem, ela tenta de novo.

O token **nunca** vai para a página. Crie um token fine-grained em GitHub → Settings →
Developer settings → Fine-grained tokens, com acesso **só** ao repositório
`enfNewsDaily` e permissão **Contents: Read and write**, e cole em `GITHUB_TOKEN` na Vercel.

Variáveis opcionais: `VITE_LINKS_URL` (outro links.json), `VITE_CLICK_ENDPOINT`
(outro endereço; vazio desliga), `LINKS_REPO` e `LINKS_RAMO` (na função).

## Testar local

`npm run dev` mostra a página, mas não roda a função. Para testar o contador local:
`npx vercel dev` (pede login na Vercel e usa o GITHUB_TOKEN de um arquivo `.env`).
