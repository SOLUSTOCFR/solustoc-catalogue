/* ========= CONFIG GOOGLE SHEET ========= */
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/14Baom-iot48MJk3uMe8hhH0-zcpqYu0Ezw9xezQbvXk/gviz/tq?tqx=out:json&gid=1562572657";

const PHOTO_BASE = "../photo/";

/* ========= VARIABLES ========= */
let produits = [];
let cart = [];
let filteredProduits = [];

/* ========= LOAD SHEET ========= */
async function loadProduits() {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    const json = JSON.parse(text.substring(47, text.length - 2));

    produits = json.table.rows.map(r => {
      return {
        id: r.c[0]?.v,
        nom: r.c[1]?.v,
        stock: parseInt(r.c[2]?.v),
        prixPublic: parseFloat((r.c[3]?.v + "").replace("€","")),
        prixSolustoc: parseFloat((r.c[4]?.v + "").replace("€","")),
        image: r.c[5]?.v,
        categorie: r.c[6]?.v
      };
    });

    filteredProduits = [...produits];
    renderProduits();
    renderCart();

  } catch (e) {
    console.error("Erreur chargement Google Sheet :", e);
  }
}

/* ========= FILTRES ========= */
function applyFilters() {
  const cat = document.getElementById("filter-category").value;

  filteredProduits = produits.filter(p => {
    return cat ? p.categorie === cat : true;
  });

  renderProduits();
}

/* ========= QUANTITÉ ========= */
function changeQty(id, delta) {
  const el = document.getElementById("qty-" + id);
  if (!el) return;

  let value = parseInt(el.textContent || "1", 10);
  value = value + delta;
  if (value < 1) value = 1;

  el.textContent = value;
}

/* ========= AJOUT PANIER ========= */
function addToCart(id, qty = 1) {
  qty = parseInt(qty, 10);
  if (qty < 1) return;

  const p = produits.find(pr => pr.id === id);
  if (!p || p.stock <= 0) return;

  const exist = cart.find(i => i.id === id);
  if (exist) exist.qty += qty;
  else cart.push({
    id: p.id,
    nom: p.nom,
    prix: p.prixSolustoc,
    prixPublic: p.prixPublic,
    qty
  });

  renderCart();
}

/* ========= AFFICHAGE PRODUITS ========= */
function renderProduits() {
  const container = document.getElementById("products");

  if (!filteredProduits.length) {
    container.innerHTML = `<p style="font-size:14px; color:#555;">Aucun bijou ne correspond à ce filtre pour le moment.</p>`;
    return;
  }

  container.innerHTML = filteredProduits.map(p => {
    const coef = p.prixPublic / p.prixSolustoc;
    const coefTxt = `Marge revendeur ≈ x${coef.toFixed(1)}`;

    const isOut = p.stock <= 0;

    return `
      <div class="card">

        <img src="${PHOTO_BASE + p.image}"
             alt="${p.nom}"
             onclick="openLightbox('${PHOTO_BASE + p.image}')">

        <div class="cat-label">${p.categorie}</div>

        <h3>${p.nom}</h3>

        <p class="price-line">
          <span class="price-solustoc">${p.prixSolustoc.toFixed(2)} € TTC</span>
          <span class="price-public">Prix public : ${p.prixPublic.toFixed(2)} €</span>
          <span class="price-public">${coefTxt}</span>
        </p>

        <p class="stock">
          ${isOut ? "<strong style='color:#b21;'>Rupture de stock</strong>" : "Stock : " + p.stock}
        </p>

        ${
          isOut
            ? `<button class="btn-small" disabled style="opacity:0.5; cursor:not-allowed;">Indisponible</button>`
            : `
              <div class="qty-row">
                <button class="qty-minus" onclick="changeQty(${p.id}, -1)">−</button>
                <span id="qty-${p.id}" class="qty-value">1</span>
                <button class="qty-plus" onclick="changeQty(${p.id}, 1)">+</button>
              </div>

              <button class="btn-small"
                      onclick="addToCart(${p.id}, document.getElementById('qty-${p.id}').textContent)">
                Ajouter
              </button>
            `
        }
      </div>
    `;
  }).join("");
}

/* ========= AFFICHAGE PANIER ========= */
function renderCart() {
  const cartBlock = document.getElementById("cart-content");

  if (!cart.length) {
    cartBlock.innerHTML = `<p style="text-align:center; font-size:13px; color:#555;">
      Aucun bijou dans votre sélection pour le moment.
    </p>`;
    document.getElementById("btn-whatsapp").disabled = true;
    return;
  }

  const total = cart.reduce((s, i) => s + i.prix * i.qty, 0);

  cartBlock.innerHTML = `
    <table class="cart-table">
      <tr><th>Article</th><th>Qté</th><th>Prix</th><th>Total</th></tr>
      ${cart
        .map(i => `
          <tr>
            <td>${i.nom}</td>
            <td>${i.qty}</td>
            <td>${i.prix.toFixed(2)} €</td>
            <td>${(i.prix * i.qty).toFixed(2)} €</td>
          </tr>
        `)
        .join("")}
    </table>

    <p class="cart-total">Total Solustoc : ${total.toFixed(2)} € TTC</p>
  `;

  document.getElementById("btn-whatsapp").disabled = false;
}

/* ========= WHATSAPP ========= */
document.getElementById("btn-clear").onclick = () => {
  cart = [];
  renderCart();
};

document.getElementById("btn-whatsapp").onclick = () => {
  if (!cart.length) return;

  let msg = "🛍️ *Commande de bijoux Solustoc*\n\n";

  cart.forEach(i => {
    msg += `• ${i.nom} × ${i.qty} — ${i.prix.toFixed(2)}€ TTC (PV ${i.prixPublic.toFixed(
      2
    )}€)\n`;
  });

  const total = cart.reduce((s, i) => s + i.prix * i.qty, 0);
  msg += `\n📦 Total : *${total.toFixed(2)} € TTC*`;

  window.open("https://wa.me/33756923323/?text=" + encodeURIComponent(msg), "_blank");
};

/* ========= LIGHTBOX ========= */
function openLightbox(src) {
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox").style.display = "flex";
}
document.getElementById("lightbox-close").onclick = () => {
  document.getElementById("lightbox").style.display = "none";
};

/* ========= INIT ========= */
loadProduits();
