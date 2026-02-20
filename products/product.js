import { supabase } from "../admin/supabaseClient.js";

/* ELEMENTS */
const colors = document.getElementById("colors");
const sizes = document.getElementById("sizes");
const galleryMain = document.getElementById("galleryMain");
const thumbs = document.getElementById("thumbs");
const addToCartBtn = document.getElementById("addToCartBtn");

const productName = document.getElementById("productName");
const productDesc = document.getElementById("productDesc");
const productPrice = document.getElementById("productPrice");
const productMrp = document.getElementById("productMrp");
const longDesc = document.getElementById("longDesc");
const productBrand = document.getElementById("productBrand");

/* SLUG */
const slug = new URLSearchParams(location.search).get("slug");
if (!slug) throw new Error("Slug missing");

let productId = null;
let variants = [];
let currentVariant = null;
let selectedSize = null;

/* LOAD PRODUCT */
async function loadProduct() {
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      brands!products_brand_id_fkey ( name )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !product) return;

  productId = product.id;

  productName.textContent = product.name;
  productBrand.textContent = product.brands?.name || "";
  productDesc.textContent = product.short_description || "";
  productPrice.textContent = `₹${product.price}`;
  productMrp.textContent = product.mrp ? `₹${product.mrp}` : "";
  longDesc.textContent = product.long_description || "";

  await loadVariants();
  updateCartCount();

  addToCartBtn.onclick = addToCart;
}

loadProduct();

/* VARIANTS */
async function loadVariants() {
  const { data } = await supabase
    .from("product_variants")
    .select("id,color_name,image_gallery")
    .eq("product_id", productId);

  variants = data || [];
  if (!variants.length) return;

  renderColors();

  const withImages = variants.find(
    v => Array.isArray(v.image_gallery) && v.image_gallery.length
  );

  setVariant(withImages || variants[0]);
}

function renderColors() {
  colors.innerHTML = "";

  variants.forEach((v, i) => {
    const el = document.createElement("span");
    el.className = "color";
    el.style.background = mapColor(v.color_name);

    el.onclick = () => {
      document.querySelectorAll(".color")
        .forEach(c => c.classList.remove("active"));
      el.classList.add("active");
      setVariant(v);
    };

    if (i === 0) el.classList.add("active");
    colors.appendChild(el);
  });
}

function setVariant(v) {
  currentVariant = v;
  renderImages(v.image_gallery || []);
  loadSizes(v.id);
}

/* IMAGES */
function renderImages(images) {
  galleryMain.innerHTML = "";
  thumbs.innerHTML = "";

  if (!images.length) {
    galleryMain.textContent = "No image available";
    return;
  }

  images.forEach((path, i) => {
    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(path);

    const url = data.publicUrl;

    if (i === 0) galleryMain.innerHTML = `<img src="${url}">`;

    const img = document.createElement("img");
    img.src = url;
    img.onclick = () => {
      galleryMain.innerHTML = `<img src="${url}">`;
    };

    thumbs.appendChild(img);
  });
}

/* SIZES */
async function loadSizes(variantId) {
  const { data } = await supabase
    .from("variant_stock")
    .select("*")
    .eq("variant_id", variantId);

  sizes.innerHTML = "";
  selectedSize = null;

  data?.forEach(s => {
    if (s.stock <= 0) return;

    const btn = document.createElement("button");
    btn.className = "size";
    btn.textContent = s.size;

    btn.onclick = () => {
      document.querySelectorAll(".size")
        .forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = s.size;
    };

    sizes.appendChild(btn);
  });
}

/* CART */
function addToCart() {
  if (!currentVariant) return alert("Select color");
  if (!selectedSize) return alert("Select size");

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const key = `${productId}_${currentVariant.id}_${selectedSize}`;

  let img = null;

if (currentVariant?.image_gallery?.[0]) {
  const { data } = supabase.storage
    .from("products")
    .getPublicUrl(currentVariant.image_gallery[0]);

  img = data?.publicUrl || null;
}


  const found = cart.find(i => i.key === key);

  if (found) found.qty++;
  else {
   cart.push({
  key,
  product_id: productId,
  variant_id: currentVariant.id,
  name: productName.textContent,
  brand: productBrand.textContent,
  color: currentVariant.color_name || "N/A",
  size: selectedSize,
  image: img,   // now always full URL or null
  price: Number(productPrice.textContent.replace("₹", "")),
  qty: 1
});

  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert("Added to cart");
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cart.reduce((s, i) => s + i.qty, 0);
}

/* COLOR MAP */
function mapColor(c) {
  return {
    black: "#000",
    brown: "#8B4513",
    tan: "#D2B48C",
    white: "#fff",
    beige: "#f5f5dc",
    grey: "#999"
  }[c?.toLowerCase()] || "#ccc";
}

/* ================= DELIVERY CHECK ================= */

const FUNCTION_URL =
  "https://vxdulkarabqzdwfjckis.supabase.co/functions/v1/check-delivery";

const checkBtn = document.getElementById("checkDeliveryBtn");
const pinInput = document.getElementById("pincodeInput");
const resultBox = document.getElementById("deliveryResult");

if (checkBtn) {
  checkBtn.addEventListener("click", async () => {

    const pin = pinInput.value.trim();

    if (!/^\d{6}$/.test(pin)) {
      resultBox.textContent = "Enter valid 6 digit pincode";
      resultBox.className = "delivery-result error";
      return;
    }

    resultBox.textContent = "Checking delivery...";
    resultBox.className = "delivery-result";

    try {

      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pincode: pin })
      });

      const data = await res.json();

      if (!data.serviceable) {
        resultBox.textContent = "Delivery not available in this area";
        resultBox.className = "delivery-result error";
        return;
      }

      const deliveryDate = new Date();
      deliveryDate.setDate(
        deliveryDate.getDate() + data.estimated_days
      );

      resultBox.innerHTML = `
        🚚 Delivery by <b>${deliveryDate.toDateString()}</b><br>
        ${data.cod ? "💵 COD Available" : "❌ COD Not Available"}<br>
        ${
          data.shipping_charge === 0
            ? "Free Shipping"
            : `Shipping ₹${data.shipping_charge}`
        }
      `;

      resultBox.className = "delivery-result success";

    } catch (err) {

      resultBox.textContent = "Unable to check delivery";
      resultBox.className = "delivery-result error";

      console.error(err);
    }

  });
}
localStorage.removeItem("cart")
