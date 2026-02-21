import { supabase } from "./admin/supabaseClient.js";

const BRANDS = [
  { id: "dce9420f-a42c-4732-a3c6-577ca05c0c91", target: "libertyProducts" },
  { id: "088b3745-49c4-4758-94ee-89620865a9d2", target: "woodlandProducts" },
  { id: "6e499e55-a97e-4904-a2a3-328f83e6155d", target: "pierreCardinProducts" },
  { id: "c292b420-168e-468f-a6f2-21d57e5d0f3a", target: "redTapeProducts" },
  { id: "7baeefbc-deb0-4fc4-92f5-189fa87af30a", target: "medifeetProducts" }
];

document.addEventListener("DOMContentLoaded", () => {
  BRANDS.forEach(b => loadBrand(b.id, b.target));
  updateCartCount();
  initSliders();
});

/* ================= LOAD BRAND ================= */

async function loadBrand(brandId, targetId) {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      short_description,
      product_variants!product_variants_product_id_fkey (
        image_gallery
      )
    `)
    .eq("brand_id", brandId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = "";

  products.forEach(p => {
    let img = "assets/images/placeholder.png";

    const variant = (p.product_variants || []).find(
      v => Array.isArray(v.image_gallery) && v.image_gallery.length
    );

    if (variant) {
      const { data } = supabase.storage
        .from("products")
        .getPublicUrl(variant.image_gallery[0]);
      img = data.publicUrl;
    }

    container.insertAdjacentHTML("beforeend", `
      <div class="product-card" data-slug="${p.slug}">
        <img src="${img}" alt="${p.name}">
        <h4>${p.name}</h4>
        <p class="desc">${p.short_description || ""}</p>

        <select class="size-select">
          <option value="">Select Size</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
        </select>

        <div class="card-footer">
          <span class="price">₹${p.price}</span>
          <button class="add-btn"
            data-id="${p.id}"
            data-name="${p.name}"
            data-price="${p.price}">
            Add to Cart
          </button>
        </div>
      </div>
    `);
  });

  /* Product click */
  container.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => {
      location.href = `products/product.html?slug=${card.dataset.slug}`;
    });
  });

  /* Add to cart with size validation */
  container.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();

      const card = btn.closest(".product-card");
      const size = card.querySelector(".size-select").value;

      if (!size) {
        alert("Please select size");
        return;
      }

      addToCart(
        btn.dataset.id,
        btn.dataset.name,
        +btn.dataset.price,
        size
      );
    });
  });
}

/* ================= CART ================= */

function addToCart(id, name, price, size) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(i => i.id === id && i.size === size);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, size, qty: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const el = document.getElementById("cartCount");

  if (el) {
    el.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }
}

/* ================= SLIDER ================= */

function initSliders() {
  document.querySelectorAll(".brand-slider").forEach(slider => {
    const container = slider.querySelector(".brand-products");
    const leftBtn = slider.querySelector(".scroll-btn.left");
    const rightBtn = slider.querySelector(".scroll-btn.right");

    if (!container || !leftBtn || !rightBtn) return;

    const scrollAmount = 300;

    rightBtn.addEventListener("click", () => {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });

    leftBtn.addEventListener("click", () => {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });
  });
}

