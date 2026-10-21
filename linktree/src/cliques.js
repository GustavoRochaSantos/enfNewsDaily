// Registro de cliques.
// A página não guarda token nenhum: ela só avisa a função /api/clique (api/clique.js,
// na Vercel) qual publicação foi clicada. Quem soma clicks + 1 no links.json é a função,
// com o token guardado nas variáveis da Vercel. VITE_CLICK_ENDPOINT troca o endereço;
// vazio desliga o contador. O clique abre o link de qualquer jeito.
const ENDPOINT = import.meta.env.VITE_CLICK_ENDPOINT ?? "/api/clique";

export function registrarClique(id) {
  if (!ENDPOINT || !id) return;
  const corpo = JSON.stringify({ id });
  try {
    // sendBeacon sobrevive à troca de página; fetch keepalive é o plano B
    const ok = navigator.sendBeacon?.(ENDPOINT, new Blob([corpo], { type: "text/plain" }));
    if (!ok) fetch(ENDPOINT, { method: "POST", body: corpo, keepalive: true, mode: "no-cors" });
  } catch {
    // contador nunca pode atrapalhar o clique
  }
}
