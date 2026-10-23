"""Confere o banco/questoes.json antes do commit: campos, gabarito, dificuldade e ids."""
import json
import re
import sys
from pathlib import Path

ARQ = Path(__file__).with_name("questoes.json")
NIVEIS = {"facil": (0, 1), "medio": (2, 3), "dificil": (4, 6)}
CARGOS = {"enfermeiro", "tecnico"}
OBRIG = ["id", "banca", "orgao", "concurso", "ano", "cargo", "numero", "assunto", "enunciado",
         "alternativas", "gabarito", "dificuldade", "criterios", "motivo_dificuldade", "explicacao", "fonte"]


def main():
    dados = json.loads(ARQ.read_text(encoding="utf-8"))
    erros, ids, provas = [], set(), set()
    for i, q in enumerate(dados.get("questoes", [])):
        onde = q.get("id") or f"#{i}"
        for c in OBRIG:
            if q.get(c) in (None, "", []):
                erros.append(f"{onde}: falta {c}")
        if q.get("id") in ids:
            erros.append(f"{onde}: id repetido")
        ids.add(q.get("id"))
        if not re.fullmatch(r"[a-z0-9-]+-q\d+", q.get("id", "")):
            erros.append(f"{onde}: id fora do padrão banca-orgao-ano-cargo-qNN")
        chave = (q.get("banca"), q.get("orgao"), q.get("ano"), q.get("cargo"), q.get("numero"))
        if chave in provas:
            erros.append(f"{onde}: mesma prova e número já no banco")
        provas.add(chave)
        if q.get("cargo") not in CARGOS:
            erros.append(f"{onde}: cargo inválido")
        letras = [a.get("letra") for a in q.get("alternativas", [])]
        if q.get("gabarito") not in letras:
            erros.append(f"{onde}: gabarito {q.get('gabarito')} não está nas alternativas {letras}")
        if any(not a.get("texto", "").strip() for a in q.get("alternativas", [])):
            erros.append(f"{onde}: alternativa vazia")
        crit = q.get("criterios") or {}
        soma = sum(crit.get(k, 0) for k in ("raciocinio", "conhecimento", "distratores"))
        faixa = NIVEIS.get(q.get("dificuldade"))
        if not faixa:
            erros.append(f"{onde}: dificuldade inválida")
        elif not faixa[0] <= soma <= faixa[1]:
            erros.append(f"{onde}: critérios somam {soma}, não batem com {q['dificuldade']}")
        if not (q.get("fonte") or {}).get("prova_url", "").startswith("https://"):
            erros.append(f"{onde}: fonte.prova_url ausente")
        if not (q.get("fonte") or {}).get("gabarito_url", "").startswith("https://"):
            erros.append(f"{onde}: fonte.gabarito_url ausente")
        expl = q.get("explicacao") or ""
        certo_errado = letras == ["C", "E"]
        inicio = {"C": "Certo.", "E": "Errado."}.get(q.get("gabarito")) if certo_errado else f"{q.get('gabarito')}."
        if expl and not expl.startswith(inicio):
            erros.append(f"{onde}: explicação não começa pelo gabarito ({inicio})")
        if q.get("anulada"):
            erros.append(f"{onde}: questão anulada não entra no banco")

    qs = dados.get("questoes", [])
    resumo = {n: sum(q.get("dificuldade") == n for q in qs) for n in NIVEIS}
    por_cargo = {c: sum(q.get("cargo") == c for q in qs) for c in CARGOS}
    print(f"{len(qs)} questões · {resumo} · {por_cargo}")
    if erros:
        print("\n".join(erros))
        sys.exit(1)
    print("ok")


if __name__ == "__main__":
    main()
