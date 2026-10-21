import { useEffect, useState } from "react";
import { carregar } from "./dados.js";
import Links from "./Links.jsx";
import Web from "./Web.jsx";

const TELA_GRANDE = "(min-width: 960px)";

function useTelaGrande() {
  const [grande, setGrande] = useState(() => window.matchMedia(TELA_GRANDE).matches);
  useEffect(() => {
    const mq = window.matchMedia(TELA_GRANDE);
    const mudou = () => setGrande(mq.matches);
    mq.addEventListener("change", mudou);
    return () => mq.removeEventListener("change", mudou);
  }, []);
  return grande;
}

export default function App() {
  const [estado, setEstado] = useState({});
  const grande = useTelaGrande();

  useEffect(() => {
    carregar()
      .then((dados) => setEstado({ dados }))
      .catch((erro) => setEstado({ erro }));
  }, []);

  const perfil = estado.dados?.perfil ?? {};
  const arroba = perfil.instagram?.match(/instagram\.com\/([^/?#]+)/)?.[1];
  const props = { ...estado, perfil, arroba };

  return grande ? <Web {...props} /> : <Links {...props} />;
}
