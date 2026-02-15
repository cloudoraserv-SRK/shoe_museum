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

/* SLUG */
const slug = new URLSearchParams(location.search).get("slug");
if (!slug) throw new Error("Slug missing");

let productId = null;
let variants = [];
let currentVariant = null;
let selectedSize = null;

/* LOAD PRODUCT */
async function loadProduct() {
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!product) return;

  productId = product.id;
  productName.textContent = product.name;
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
  renderColors();

  // ✅ FIX: pick first variant WITH images
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
    galleryMain.textContent = "No image";
    return;
  }

  images.forEach((path, i) => {
    const url = supabase.storage.from("products")
      .getPublicUrl(path).data.publicUrl;

    if (i === 0) galleryMain.innerHTML = `<img src="${url}">`;

    const t = document.createElement("img");
    t.src = url;
    t.onclick = () => galleryMain.innerHTML = `<img src="${url}">`;
    thumbs.appendChild(t);
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
    btn.textContent = s.size;
    btn.onclick = () => {
      document.querySelectorAll(".size")
        .forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = s.size;
    };

    btn.className = "size";
    sizes.appendChild(btn);
  });
}

/* CART */
function addToCart() {
  if (!currentVariant) return alert("Select color");
  if (!selectedSize) return alert("Select size");

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const key = `${productId}_${currentVariant.id}_${selectedSize}`;

  const img = currentVariant.image_gallery?.[0]
    ? supabase.storage.from("products")
        .getPublicUrl(currentVariant.image_gallery[0]).data.publicUrl
    : "";

  const found = cart.find(i => i.key === key);
  if (found) found.qty++;
  else cart.push({
    key,
    product_id: productId,
    variant_id: currentVariant.id,
    name: productName.textContent,
    color: currentVariant.color_name,
    size: selectedSize,
    image: img,
    price: Number(productPrice.textContent.replace("₹","")),
    qty: 1
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert("Added to cart");
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cart.reduce((s,i)=>s+i.qty,0);
}

function mapColor(c) {
  return {
    black:"#000", brown:"#8B4513", tan:"#D2B48C",
    white:"#fff", beige:"#f5f5dc", grey:"#999"
  }[c?.toLowerCase()] || "#ccc";
}
