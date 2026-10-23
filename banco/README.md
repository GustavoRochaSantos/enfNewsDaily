# Banco de questões do simulador

`questoes.json` alimenta o simulador do site (`linktree/src/Simulado.jsx`, em `/simulado`).
A página lê o arquivo direto do raw.githubusercontent, então um lote novo entra no ar
sem novo deploy. Antes de cada commit, rode `python3 banco/validar.py`.

## Regras de entrada

- Só prova **oficial**, baixada do site da banca (ou do órgão, .gov.br), de concurso de
  enfermagem dos últimos 5 anos. Nada copiado de site de questões (QConcursos, TEC etc.),
  nem enunciado nem comentário.
- Só com **gabarito definitivo** (após recursos). Questão anulada não entra; questão com
  gabarito alterado entra com a letra do definitivo.
- Se a lei, resolução ou protocolo que a questão cobra mudou depois da prova, a questão
  não entra.
- Questão que depende de figura ou tabela em imagem fica de fora por enquanto.
- Questão com texto de apoio leva o texto em `texto_base`.
- O texto é transcrito fiel à prova (só se corrige quebra de linha e hifenização do PDF).

## Formato

```json
{
  "atualizado": "2026-10-23",
  "questoes": [
    {
      "id": "fgv-ebserh-2023-enfermeiro-q31",
      "banca": "FGV",
      "orgao": "Ebserh",
      "concurso": "Concurso Nacional Ebserh, Edital nº 1/2023",
      "ano": 2023,
      "data_prova": "2023-05-14",
      "cargo": "enfermeiro",            // enfermeiro | tecnico
      "caderno": "Tipo 1 - Branca",
      "numero": 31,
      "assunto": "Farmacologia e cálculo de medicação",
      "texto_base": null,
      "enunciado": "…",
      "alternativas": [{ "letra": "A", "texto": "…" }],
      "gabarito": "C",
      "dificuldade": "medio",           // facil | medio | dificil
      "criterios": { "raciocinio": 1, "conhecimento": 1, "distratores": 0 },
      "motivo_dificuldade": "Aplica a regra de três a um caso, sem conversão de unidade.",
      "fonte": {
        "prova_url": "https://…",
        "gabarito_url": "https://…",
        "pagina_url": "https://…"
      },
      "conferido_em": "2026-10-23"
    }
  ]
}
```

O `id` segue `banca-orgao-ano-cargo-qNN` em minúsculas e sem acento.

## Critério de dificuldade

Não há estatística oficial de acerto por questão, então a classificação é feita na
importação com três critérios, de 0 a 2 cada:

| Critério | 0 | 1 | 2 |
|---|---|---|---|
| **Raciocínio** | reconhecer um conceito ou definição | aplicar o conceito a um caso | vários passos (cálculo com conversão, caso clínico que junta dados) |
| **Conhecimento** | base da formação (técnica, biossegurança, anatomia) | protocolo ou norma muito cobrada (Lei 7.498, PNI, SAE) | detalhe específico (artigo, prazo, dose, ponto de corte pouco cobrado) |
| **Distratores** | alternativas bem diferentes | duas alternativas plausíveis | alternativas quase iguais, "EXCETO/INCORRETA" ou julgar afirmativas I, II, III |

Soma 0–1 = **fácil**, 2–3 = **médio**, 4–6 = **difícil**. O motivo vai em
`motivo_dificuldade` e aparece na correção do simulado. O dono pode ajustar qualquer
classificação à mão; mais adiante, a taxa de acerto real do simulador recalibra.

## Sorteio

O simulado sorteia na proporção 45% fáceis, 35% médias e 20% difíceis, arredondando
pelo maior resto (10 = 5/3/2, 15 = 7/5/3, 20 = 9/7/4, 30 = 14/10/6). Se faltar
questão numa faixa, completa com a faixa vizinha e avisa na tela.
