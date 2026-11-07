const cards = document.querySelector("#cards");
const search = document.querySelector("#search");
const category = document.querySelector("#category");
const status = document.querySelector("#status");
let tours = [];
const fallback = [
  {
    id: 1,
    title: "Passeios pelo litoral",
    category: "barco",
    location: "Maceió, AL",
    description:
      "Conheça possibilidades de passeios de barco pelo litoral. Consulte rotas e duração diretamente com os prestadores.",
    image_url:
      "https://maceio.al.gov.br/transform/imagens/_1200x630_crop_center-center_82_none/Turismo-Massayo-Verao-2025-Foto-Itawi-Albuquerque.jpeg?mtime=1737397460",
    image_credit: "Prefeitura de Maceió / Itawi Albuquerque",
    verified: 0,
  },
  {
    id: 2,
    title: "Experiências de catamarã",
    category: "catamara",
    location: "Ponta Verde, Maceió",
    description:
      "Conheça a modalidade de passeio de catamarã. Os serviços reais dependem de cadastro e confirmação.",
    image_url:
      "https://www.amenithotel.com.br/v2/wp-content/uploads/2023/03/IMagem-Catamara-Lopana-Maceio.jpg",
    image_credit: "Amenit Hotel / imagem de catamarã em Maceió",
    verified: 0,
  },
  {
    id: 3,
    title: "Mergulho e contemplação",
    category: "mergulho",
    location: "Piscinas naturais da Pajuçara",
    description:
      "Atividades de observação da vida marinha e mergulho, conforme condições do mar e orientação dos profissionais.",
    image_url:
      "https://www.amenithotel.com.br/v2/wp-content/uploads/2022/04/02-Piscinas-Naturais-de-Pajucara-Foto-Ciro-Amado-02-1024x683-1.jpg",
    image_credit: "Foto: Ciro Amado / Amenit Hotel",
    verified: 0,
  },
  {
    id: 4,
    title: "Passeios de jangada",
    category: "jangada",
    location: "Pajuçara, Maceió",
    description:
      "Conheça as jangadas tradicionais e as experiências ligadas às piscinas naturais da Pajuçara.",
    image_url:
      "https://img.7segundos.com.br/0bEZCK6FXqBN1YpD58g5WiQXmII%3D/1200x630/smart/s3.7segundos.com.br/uploads/imagens/117047-passeio_de_jangada_na_praia_da_pajucara_1024x686_jpg.jpeg",
    image_credit: "7Segundos / passeio de jangada em Pajuçara",
    verified: 0,
  },
];
const labels = {
  barco: "PASSEIO DE BARCO",
  catamara: "CATAMARÃ",
  mergulho: "ATIVIDADES AQUÁTICAS",
  jangada: "EMBARCAÇÕES",
};
function safeImage(url) {
  try {
    let u = new URL(url);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}
function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}
function render() {
  cards.replaceChildren();
  let q = search.value.trim().toLocaleLowerCase("pt-BR");
  let filtered = tours.filter(
    (t) =>
      (category.value === "todos" || t.category === category.value) &&
      [t.title, t.location, t.description, t.provider]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(q),
  );
  status.textContent = `${filtered.length} opção(ões) encontrada(s).`;
  filtered.forEach((t) => {
    const article = el("article", "tour-card");
    const photo = el("div", "tour-photo");
    const img = el("img");
    img.src = safeImage(t.image_url) || "assets/placeholder.svg";
    img.alt = `Imagem ilustrativa de ${t.title}`;
    img.loading = "lazy";
    img.onerror = () => {
      img.onerror = null;
      img.src = "assets/placeholder.svg";
    };
    photo.append(
      img,
      el(
        "span",
        "tag",
        t.verified ? "INFORMAÇÕES CONFIRMADAS" : "EXEMPLO DE CATEGORIA",
      ),
    );
    const body = el("div", "tour-body");
    body.append(
      el("small", "", labels[t.category] || "PASSEIO"),
      el("h3", "", t.title),
      el("p", "", t.description),
      el("div", "tour-meta", "⌖ " + (t.location || "Local a confirmar")),
    );
    const b = el("button", "card-link", "Ver informações ↗");
    b.addEventListener("click", () => showDetail(t));
    body.append(b);
    const credit = el(
      "div",
      "credit",
      t.image_credit ? "Foto: " + t.image_credit : "Imagem ilustrativa",
    );
    body.append(credit);
    article.append(photo, body);
    cards.append(article);
  });
}
function showDetail(t) {
  const d = document.querySelector("#detailDialog");
  const c = document.querySelector("#detailContent");
  c.replaceChildren(
    el("span", "eyebrow blue", labels[t.category] || "PASSEIO"),
    el("h2", "", t.title),
    el("p", "", t.description),
    el("p", "", `Local: ${t.location || "A confirmar"}`),
    el("p", "", `Prestador: ${t.provider || "Ainda não cadastrado"}`),
    el(
      "p",
      "",
      t.verified
        ? "Informações marcadas como confirmadas pelo administrador."
        : "Informações demonstrativas — verificar com o prestador.",
    ),
  );
  if (t.contact && t.verified) {
    c.append(el("p", "", `Contato informado pelo prestador: ${t.contact}`));
  }
  d.showModal();
}
document.querySelector("#closeDialog").onclick = () =>
  document.querySelector("#detailDialog").close();
document.querySelector("#closeDetail").onclick = () =>
  document.querySelector("#detailDialog").close();
async function load() {
  try {
    const r = await fetch("/api/tours");
    if (!r.ok) throw Error();
    tours = await r.json();
    status.textContent = "Dados carregados do banco SQLite.";
  } catch {
    tours = fallback;
    status.textContent =
      "Modo demonstração: abra com python server.py para ativar o banco de dados.";
  }
  render();
}
search.addEventListener("input", render);
category.addEventListener("change", render);
document.querySelector("#clearFilters").onclick = () => {
  search.value = "";
  category.value = "todos";
  render();
};
const mb = document.querySelector("#menuBtn"),
  menu = document.querySelector("#menu");
mb.onclick = () => {
  const open = menu.classList.toggle("open");
  mb.setAttribute("aria-expanded", String(open));
  mb.textContent = open ? "×" : "☰";
};
menu.querySelectorAll("a").forEach(
  (a) =>
    (a.onclick = () => {
      menu.classList.remove("open");
      mb.setAttribute("aria-expanded", "false");
      mb.textContent = "☰";
    }),
);
document
  .querySelector("#interestForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = document.querySelector("#formStatus");
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    delete data.consent;
    try {
      const r = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await r.json();
      if (!r.ok) throw Error(res.error || "Falha ao enviar");
      msg.textContent =
        "Interesse registrado no banco de dados local. Obrigado!";
      form.reset();
    } catch (err) {
      msg.textContent =
        "Não foi possível salvar: " +
        err.message +
        ". Inicie o servidor com python server.py.";
    }
  });
load();
