import { supabase } from "../admin/supabaseClient.js";

const grid = document.getElementById("productsGrid");
const urlParams = new URLSearchParams(window.location.search);

const categoryFromUrl = urlParams.get("category");
const styleFromUrl = urlParams.get("style");
const brandFromUrl = urlParams.get("brand");

document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {

  let styleId = null;
  let categoryId = null;
  let brandId = null;

  /* BRAND */
  if (brandFromUrl) {
    const { data } = await supabase
      .from("brands")
      .select("id")
      .ilike("slug", brandFromUrl)
      .single();

    if (data) brandId = data.id;
  }

  /* STYLE */
  if (styleFromUrl) {
    const { data } = await supabase
      .from("styles")
      .select("id")
      .ilike("name", styleFromUrl)
      .single();

    if (data) styleId = data.id;
  }

  /* CATEGORY */
  if (categoryFromUrl) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", categoryFromUrl)
      .single();

    if (data) categoryId = data.id;
  }

  /* MAIN QUERY */
  let query = supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      mrp,
      short_description,
      brand_id,
      style_id,
      category_id,
      brands!products_brand_id_fkey (
        id,
        name,
        slug
      ),
      styles!products_style_id_fkey (
        id,
        name
      ),
      categories!products_category_id_fkey (
        id,
        name
      ),
      product_variants!product_variants_product_id_fkey (
        id,
        image_gallery,
        color_name,
        variant_stock!variant_stock_variant_id_fkey (
          size,
          stock
        )
      )
    `)
    .eq("active", true);

  if (styleId) query = query.eq("style_id", styleId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (brandId) query = query.eq("brand_id", brandId);

  const { data: products, error } = await query;

  if (error) {
    console.error(error);
    grid.innerHTML = "<p>Error loading products</p>";
    return;
  }

  window.ALL_PRODUCTS = products || [];
  renderProducts(window.ALL_PRODUCTS);
}

/* ================= RENDER ================= */

window.renderProducts = function(products) {

  grid.innerHTML = "";

  if (!products.length) {
    grid.innerHTML = "<p>No products found</p>";
    return;
  }

  products.forEach(p => {

    let img = "../assets/images/placeholder.png";

    const variant = p.product_variants?.[0];

    if (variant?.image_gallery?.length) {
      const { data } = supabase.storage
        .from("products")
        .getPublicUrl(variant.image_gallery[0]);

      img = data.publicUrl;
    }

    let sizes = [];

    p.product_variants?.forEach(v => {
      v.variant_stock?.forEach(s => {
        if (s.stock > 0) sizes.push(s.size);
      });
    });

    sizes = [...new Set(sizes)];

    grid.insertAdjacentHTML("beforeend", `
  <div class="product-card">

    <a href="product.html?slug=${p.slug}" class="product-link">

      <img src="${img}" alt="${p.name}">

      <div class="product-info">
        <h4 class="brand">${p.brands?.name || ""}</h4>
        <h3>${p.name}</h3>

        <div class="price-row">
          ${p.mrp ? `<span class="mrp">₹${p.mrp}</span>` : ""}
          <span class="price">₹${p.price}</span>
        </div>

        <p class="desc">${p.short_description || ""}</p>
      </div>

    </a>

    <select class="size-select">
      <option value="">Select Size</option>
      ${sizes.map(s => `<option value="${s}">${s}</option>`).join("")}
    </select>

    <button class="add-btn"
      data-id="${p.id}"
      data-name="${p.name}"
      data-price="${p.price}">
      Add to Cart
    </button>

  </div>
`);

  });

  initCartButtons();
};
function initCartButtons() {

  document.querySelectorAll(".add-btn").forEach(btn => {

    btn.onclick = () => {

      const card = btn.closest(".product-card");
      const size = card.querySelector(".size-select").value;

      if (!size) {
        alert("Select size first");
        return;
      }

      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = +btn.dataset.price;

      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      const existing = cart.find(i => i.id === id && i.size === size);

      if (existing) existing.qty++;
      else cart.push({ id, name, price, size, qty: 1 });

      localStorage.setItem("cart", JSON.stringify(cart));
      alert("Added to cart");
    };

  });

}
