# links.json: formato

Arquivo: `links.json` na raiz deste repositório. URL pública (CORS liberado, cache de ~5 min):
`https://raw.githubusercontent.com/GustavoRochaSantos/enfNewsDaily/main/links.json`

Gerado por `scripts/gerar_links.py` na pasta EnfNews, chamado sozinho pelo
`scripts/publicar_api.py` depois de cada publicação real. Não edite à mão, exceto os campos
`clicks`, `destaque` e `ativo`, que o gerador sempre mantém.

```json
{
  "versao": 1,
  "atualizado_em": "2026-10-21T12:10:05-03:00",
  "perfil": { "nome": "EnfNews", "instagram": "https://www.instagram.com/<usuario>/", "avatar": null },
  "publicacoes": [ { ...item... } ]
}
```

`publicacoes` vem da mais nova para a mais antiga (por `data`, depois `id`).

## Item

| Campo | Tipo | O que é |
|---|---|---|
| `id` | texto | Nome da pasta do post (`2026-10-21-qua-edital-confins-mg`). Único e fixo. |
| `tipo` | `"post"` \| `"quiz"` \| `"concurso"` | `post` = post do dia, `quiz` = questão de concurso, `concurso` = edital/concurso. |
| `titulo` | texto | Título da capa. |
| `subtitulo` | texto | Linha de apoio da capa (sem marcação). |
| `chamada` | texto | Etiqueta curta da capa ("Quarta de feridas", "Edital novo · Confins (MG)"). |
| `editoria` | texto | Editoria do post ("Feridas", "Concursos"...). |
| `data` | `AAAA-MM-DD` | Dia do post. |
| `capa` | URL | Capa em JPEG (3:4, 1350×1800) no próprio repositório. |
| `instagram` | URL \| null | Link do carrossel no Instagram. |
| `reel` | URL \| null | Link do Reel, se houver. |
| `url` | URL \| null | Destino do botão: o post no Instagram (concurso sem link do post cai no edital). |
| `destaque` | bool | Fixa no topo. Padrão `false`; o dono muda à mão. |
| `ativo` | bool | `false` esconde da página. Sem `url` é sempre `false`. |
| `clicks` | número | Contador de cliques, começa em 0. A página incrementa; o gerador nunca zera. |
| `concurso` | objeto | Só quando `tipo` = `"concurso"` (abaixo). |

### `concurso`

| Campo | Tipo | O que é |
|---|---|---|
| `edital` | URL | Link oficial (banca/órgão), nunca agregador. |
| `edital_rotulo` | texto \| null | Descrição do link. |
| `inscricoes_ate` | ISO 8601 com fuso (`2026-11-05T16:00:00-03:00`) \| null | Fim das inscrições. A página decide se está aberto comparando com a hora atual (o JSON não guarda "aberto", que ficaria velho). |
| `orgao`, `uf`, `banca`, `vagas` | texto \| null | Dados da ficha (posts antigos podem vir com null). |

## Quando é atualizado

- Toda publicação de carrossel ou Reel pelo `publicar_api.py --publicar` (faz `git pull`, regrava,
  commit e push). Ensaio não mexe.
- À mão: `python3 scripts/gerar_links.py --push` (post publicado pelo app, prazo de concurso alterado).
- Entra todo post com `publicado.txt` ou com status "publicado" em `controle/historico.md`.
