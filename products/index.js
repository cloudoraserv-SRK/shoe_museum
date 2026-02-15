import { supabase } from "../admin/supabaseClient.js";

const grid = document.getElementById("productsGrid");

document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {
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
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = "<p>Error loading products</p>";
    return;
  }

  renderProducts(products || []);
}

function renderProducts(products) {
  grid.innerHTML = "";

  if (!products.length) {
    grid.innerHTML = "<p>No products found</p>";
    return;
  }

  products.forEach(p => {
    let img = "../assets/images/placeholder.png";

    const v = (p.product_variants || []).find(
      x => Array.isArray(x.image_gallery) && x.image_gallery.length
    );

    if (v) {
      img = supabase.storage
        .from("products")
        .getPublicUrl(v.image_gallery[0]).data.publicUrl;
    }

    grid.insertAdjacentHTML(
      "beforeend",
      `
      <a href="product.html?slug=${p.slug}" class="product-card">
        <img src="${img}" alt="${p.name}">
        <h3>${p.name}</h3>
        <span>₹${p.price}</span>
      </a>
      `
    );
  });
}
