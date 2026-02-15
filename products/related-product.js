import { supabase } from "../admin/supabaseClient.js";

const relatedGrid = document.getElementById("relatedGrid");
const slug = new URLSearchParams(location.search).get("slug");

if (relatedGrid && slug) loadRelated();

/* ================= LOAD RELATED ================= */
async function loadRelated() {
  // current product
  const { data: product } = await supabase
    .from("products")
    .select("id,brand_id,category_id")
    .eq("slug", slug)
    .single();

  if (!product) return;

  // related products
  const { data: products } = await supabase
    .from("products")
    .select(`
      id,name,slug,price,
      product_variants!product_variants_product_id_fkey (
        image_gallery
      )
    `)
    .neq("id", product.id)
    .eq("active", true)
    .or(
      `brand_id.eq.${product.brand_id},category_id.eq.${product.category_id}`
    )
    .limit(4);

  relatedGrid.innerHTML = "";

  products?.forEach(p => {
    const v = p.product_variants?.find(
      x => Array.isArray(x.image_gallery) && x.image_gallery.length
    );

    const img = v
      ? supabase.storage
          .from("products")
          .getPublicUrl(v.image_gallery[0]).data.publicUrl
      : "assets/images/placeholder.png";

    relatedGrid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="related-card" data-slug="${p.slug}">
        <img src="${img}" alt="${p.name}">
        <h4>${p.name}</h4>
        <span class="price">₹${p.price}</span>
      </div>
      `
    );
  });

  // click → product page
  relatedGrid.querySelectorAll(".related-card").forEach(card => {
    card.onclick = () =>
      location.href = `product.html?slug=${card.dataset.slug}`;
  });
}
