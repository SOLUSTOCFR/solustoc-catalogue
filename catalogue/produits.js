/* ========= CONFIG ========= */
const PHOTO_BASE = "/solustoc-catalogue/catalogue/photo/";

/* ========= BASE PRODUITS ========= */
const produits = [
  {
    id: "LOVEYOU",
    nom: "Bracelet Love You",
    prix: 6.90,
    stock: 6,
    image: "Bracelet Love you -1-portrait-748w.webp"
  },
  {
    id: "LETTREW",
    nom: "Collier Lettre W",
    prix: 5.90,
    stock: 7,
    image: "LETTRE W-portrait-320w.webp"
  }
];

/* ========= PANIER ========= */
let cart = [];

/* Ajoute au panier */
function addToCart(index) {
  const p = produits[index];
  const exist = cart.find(i => i.nom === p.nom);
  if (exist) exist.qty++;
  else cart.push({ nom: p.nom, prix: p.prix, qty: 1 });
  renderCart();
}

/* Supprime la sélection */
document.getElementById("btn-clear").onclick = () => {
  cart = [];
  renderCart();
};

/* Envoie WhatsApp */
document.getElementById("btn-whatsapp").onclick = () => {
  if (!cart.length) return;
  let msg = "🛍️ *Commande de bijoux Solustoc*\n\n";
  cart.forEach(i => msg += `• ${i.nom} × ${i.qty} — ${i.prix}€\n`);
  const total = cart.reduce((s, i) => s + i.prix * i.qty, 0);
  msg += `\n📦 Total : *${total.toFixed(2)} € TTC*`;
  window.open("https://wa.me/33756923323/?text=" + encodeURIComponent(msg), "_blank");
};

/* ========= AFFICHAGE ========= */
function renderProduits() {
  const container = document.getElementById("products");
  container.innerHTML = produits
    .map((p, i) => `
      <div class="card">
        <img src="${PHOTO_BASE + p.image}" onclick="openLightbox('${PHOTO_BASE + p.image}')">
        <h3>${p.nom}</h3>
        <p class="price-solustoc">${p.prix.toFixed(2)} € TTC</p>
        <p class="stock">Stock : ${p.stock}</p>
        <button class="btn-small" onclick="addToCart(${i})">Ajouter</button>
      </div>
    `)
    .join("");
}

/* ========= PANIER ========= */
function renderCart() {
  const cartBlock = document.getElementById("cart-content");
  if (!cart.length) {
    cartBlock.innerHTML = `<p style="text-align:center; font-size:13px; color:#555;">Aucun bijou dans votre sélection pour le moment.</p>`;
    document.getElementById("btn-whatsapp").disabled = true;
    return;
  }
  cartBlock.innerHTML = `
    <table class="cart-table">
      <tr><th>Article</th><th>Qté</th><th>Total</th></tr>
      ${cart
        .map(i => `<tr><td>${i.nom}</td><td>${i.qty}</td><td>${(i.qty * i.prix).toFixed(2)} €</td></tr>`)
        .join("")}
    </table>
    <p class="cart-total">Total : ${cart.reduce((s, i) => s + i.prix * i.qty, 0).toFixed(2)} € TTC</p>
  `;
  document.getElementById("btn-whatsapp").disabled = false;
}

/* ========= LIGHTBOX ========= */
function openLightbox(src) {
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox").style.display = "flex";
}
document.getElementById("lightbox-close").onclick = () => {
  document.getElementById("lightbox").style.display = "none";
};
