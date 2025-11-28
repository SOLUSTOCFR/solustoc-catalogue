/* ================================
      CONFIGURATION GOOGLE SHEET
================================ */

const GOOGLE_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/14Baom-i0t48OMk8Jw8hM8Nh_2Q9YX0aZwxeoz9Wk3s/gviz/tq?tqx=out:json";

/* Dossier des photos */
const PHOTO_BASE = "../photo/";

/* ================================
      CHARGEMENT DES DONNÉES
================================ */

let produits = [];
let filteredProduits = [];
let cart = [];

/* Charge Google Sheet → JSON */
async function loadSheet() {
  try {
    const res = await fetch(GOOGLE_SHEET_URL);
    const text = await res.text();

    // Nettoyage format Google
    const json = JSON.parse(text.substring(47, text.length - 2));

    const rows = json.table.rows;

    produits = rows.map((r, index) => ({
      id: index + 1,
      nom: r.c[0]?.v || "",
      stock: r.c[1]?.v || 0,
      prixPublic: parseFloat(r.c[2]?.v || 0),
      prixSolustoc: parseFloat(r.c[3]?.v || 0),
      image: r.c[5]?.v || "",
      categorie: r.c[6]?.v || ""
    }));

    // Suppression lignes vides
    produits = produits.filter(p => p.nom && p.image);

    filteredProduits = [...produits];

    populateCategories();
    renderProduits();
  } catch (err) {
    console.error("Erreur Google Sheet :", err);
    document.getElementById("products").innerHTML =
      `<p style="color:red;">Erreur chargement Google Sheet.</p>`;
  }
}

/* ================================
        FILTRES CATÉGORIES
================================ */

function populateCategories() {
  const select = document.getElementById("filter-category");

  const categories = [...new Set(produits.map(p => p.categorie))].sort();

  select.innerHTML =
    `<option value="">Toutes les catégories</option>` +
    categories.map(c => `<option value="${c}">${c}</option>`).join("");

  select.onchange = applyFilters;
}

function applyFilters() {
  const cat = document.getElementById("filter-category").value;
  filteredProduits = produits.filter(p => (!cat || p.categorie === cat));
  renderProduits();
}

/* ================================
        AFFICHAGE PRODUITS
================================ */

function renderProduits() {
  const container = document.getElementById("products");

  if (!filteredProduits.length) {
    container.innerHTML =
      `<p style="font-size:14px;color:#555;">Aucun produit trouvé</p>`;
    return;
  }

  container.innerHTML = filteredProduits
    .map(p => {
      const coef = p.prixPublic && p.prixSolustoc
        ? (p.prixPublic / p.prixSolustoc).toFixed(1)
        : "-";

      return `
      <div class="card">

        <img src="${PHOTO_BASE + p.image}"
             alt="${p.nom}"
             onclick="openLightbox('${PHOTO_BASE + p.image}')">

        <div class="cat-label">${p.categorie}</div>

        <h3>${p.nom}</h3>

        <p class="price-line">
          <span class="price-solustoc">${p.prixSolustoc.toFixed(2)} € TTC</span>
          <span class="price-public">Prix public : ${p.prixPublic.toFixed(2)} € TTC</span>
          <span class="price-public">Marge ≈ x${coef}</span>
        </p>

        <p class="stock">Stock : ${p.stock}</p>

        <div class="qty-row">
          <button class="qty-minus" onclick="changeQty(${p.id}, -1)">−</button>
          <span id="qty-${p.id}" class="qty-value">1</span>
          <button class="qty-plus" onclick="changeQty(${p.id}, 1)">+</button>
        </div>

        <button class="btn-small"
                onclick="addToCart(${p.id}, document.getElementById('qty-${p.id}').textContent)">
          Ajouter
        </button>
      </div>`;
    })
    .join("");
}

/* ================================
            PANIER
================================ */

function changeQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  let v = parseInt(el.textContent);
  v = Math.max(1, v + delta);
  el.textContent = v;
}

function addToCart(id, qty) {
  qty = parseInt(qty);
  if (qty < 1) return;

  const p = produits.find(x => x.id === id);
  if (!p) return;

  const exist = cart.find(x => x.id === id);
  if (exist) exist.qty += qty;
  else cart.push({ ...p, qty });

  renderCart();
}

function renderCart() {
  const block = document.getElementById("cart-content");

  if (!cart.length) {
    block.innerHTML =
      `<p style="text-align:center;font-size:13px;color:#555;">
        Aucun bijou dans votre sélection.
      </p>`;
    document.getElementById("btn-whatsapp").disabled = true;
    return;
  }

  const total = cart.reduce((s, x) => s + x.prixSolustoc * x.qty, 0);

  block.innerHTML = `
    <table class="cart-table">
      <tr><th>Article</th><th>Qté</th><th>Prix</th><th>Total</th></tr>
      ${cart
        .map(
          x => `
        <tr>
          <td>${x.nom}</td>
          <td>${x.qty}</td>
          <td>${x.prixSolustoc.toFixed(2)}€</td>
          <td>${(x.prixSolustoc * x.qty).toFixed(2)}€</td>
        </tr>`
        )
        .join("")}
    </table>

    <p class="cart-total">Total : ${total.toFixed(2)} € TTC</p>
  `;

  document.getElementById("btn-whatsapp").disabled = false;
}

document.getElementById("btn-clear").onclick = () => {
  cart = [];
  renderCart();
};

document.getElementById("btn-whatsapp").onclick = () => {
  let msg = "*Commande Solustoc – Bijoux*\n\n";
  cart.forEach(x => {
    msg += `• ${x.nom} × ${x.qty} — ${(x.prixSolustoc * x.qty).toFixed(2)}€\n`;
  });
  const total = cart.reduce((s, x) => s + x.prixSolustoc * x.qty, 0);
  msg += `\nTotal : ${total.toFixed(2)}€ TTC`;

  window.open(
    "https://wa.me/33756923323?text=" + encodeURIComponent(msg),
    "_blank"
  );
};

/* ================================
        LIGHTBOX
================================ */

function openLightbox(src) {
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox").style.display = "flex";
}
document.getElementById("lightbox-close").onclick = () =>
  (document.getElementById("lightbox").style.display = "none");

/* ================================
            INIT
================================ */

loadSheet();
