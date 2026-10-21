import { useEffect, useState } from "react";

// Movimento da página: entrada dos blocos ao rolar, onda no clique e seção ativa no menu.
// Tudo respeita "reduzir movimento" do sistema (o CSS desliga as animações nesse caso).

export const semMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Elementos com [data-revelar] entram (fade + subida) quando aparecem na tela.
// `pronto` muda quando os dados chegam, para observar os cartões novos.
export function useRevelar(pronto) {
  useEffect(() => {
    const alvos = document.querySelectorAll("[data-revelar]:not(.visivel)");
    if (semMovimento() || !("IntersectionObserver" in window)) {
      alvos.forEach((el) => el.classList.add("visivel"));
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("visivel");
          obs.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    alvos.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [pronto]);
}

// Onda (ripple) a partir do ponto do clique, em qualquer elemento com [data-onda].
export function useOnda() {
  useEffect(() => {
    const aoTocar = (ev) => {
      const el = ev.target.closest?.("[data-onda]");
      if (!el || semMovimento()) return;
      const r = el.getBoundingClientRect();
      const tam = Math.max(r.width, r.height) * 2;
      const onda = document.createElement("span");
      onda.className = "onda";
      onda.style.cssText = `width:${tam}px;height:${tam}px;left:${ev.clientX - r.left - tam / 2}px;top:${ev.clientY - r.top - tam / 2}px`;
      el.appendChild(onda);
      onda.addEventListener("animationend", () => onda.remove());
    };
    document.addEventListener("pointerdown", aoTocar);
    return () => document.removeEventListener("pointerdown", aoTocar);
  }, []);
}

// true depois de rolar alguns pixels (o menu ganha sombra e encolhe)
export function useRolou(limite = 12) {
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const ver = () => setRolou(window.scrollY > limite);
    ver();
    window.addEventListener("scroll", ver, { passive: true });
    return () => window.removeEventListener("scroll", ver);
  }, [limite]);
  return rolou;
}

// id da seção que está no meio da tela, para destacar o item do menu
export function useSecaoAtiva(ids, pronto) {
  const [ativa, setAtiva] = useState(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visivel) setAtiva(visivel.target.id);
        else if (els[0].getBoundingClientRect().top > window.innerHeight / 2) setAtiva(null); // voltou para o topo
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids.join(","), pronto]);
  return ativa;
}
