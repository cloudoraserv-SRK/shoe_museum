import { supabase } from "../admin/supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {

  const relatedGrid = document.getElementById("relatedGrid");
  const loadMoreBtn = document.getElementById("loadMoreRelated");
  const slug = new URLSearchParams(location.search).get("slug");

  if (!relatedGrid || !slug) return;

  let page = 0;
  const limit = 4;
  let currentProduct = null;

  init();

  /* ================= INIT ================= */
  async function init() {

    const { data, error } = await supabase
      .from("products")
      .select("id, brand_id, category_id")
      .eq("slug", slug)
      .single();

    if (error || !data) return;

    currentProduct = data;
    loadRelated();

    loadMoreBtn?.addEventListener("click", () => {
      page++;
      loadRelated();
    });
  }

  /* ================= LOAD RELATED ================= */
  async function loadRelated() {

  const from = page * limit;

 const { data: products, error } = await supabase
  .from("products")
  .select(`
    id,
    name,
    slug,
    price,
    short_description,
    active,
    brands!products_brand_id_fkey ( name ),
    categories!products_category_id_fkey ( name ),
    product_variants!product_variants_product_id_fkey (
      id,
      color_name,
      image_gallery,
      variant_stock!variant_stock_variant_id_fkey (
        size,
        stock
      )
    )
  `)
  .neq("id", currentProduct.id)
  .eq("active", true)   // 🔥 IMPORTANT
  .order("id", { ascending: false })
  .range(from, from + limit - 1);


console.log("Related Products:", products);
console.log("Error:", error);


  if (!products || products.length === 0) {
    if (page === 0) {
      relatedGrid.innerHTML = "<p>No related products found</p>";
    }
    loadMoreBtn && (loadMoreBtn.style.display = "none");
    return;
  }

  products.forEach(renderCard);
}


  /* ================= CARD ================= */
  function renderCard(p) {

    const variant = p.product_variants?.[0];

    const img = variant?.image_gallery?.[0]
      ? supabase.storage
          .from("products")
          .getPublicUrl(variant.image_gallery[0]).data.publicUrl
      : "assets/images/placeholder.png";

    const colors = [...new Set(
      p.product_variants?.map(v => v.color_name)
    )].filter(Boolean).join(", ");

    const sizes = [...new Set(
      p.product_variants?.flatMap(v =>
        v.variant_stock?.filter(s => s.stock > 0).map(s => s.size)
      )
    )].filter(Boolean).join(", ");

    relatedGrid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="related-card" data-slug="${p.slug}">
        <img src="${img}" alt="${p.name}">
        <div class="card-body">
          <small class="brand">${p.brands?.name || ""}</small>
          <h4>${p.name}</h4>
          <p class="category">${p.categories?.name || ""}</p>
          <p class="desc">${p.short_description || ""}</p>
          <p class="meta"><b>Colors:</b> ${colors || "N/A"}</p>
          <p class="meta"><b>Sizes:</b> ${sizes || "N/A"}</p>
          <span class="price">₹${p.price}</span>
        </div>
      </div>
      `
    );

    relatedGrid.querySelectorAll(".related-card").forEach(card => {
      card.onclick = () =>
        location.href = `product.html?slug=${card.dataset.slug}`;
    });
  }

});
