import { supabase } from "../admin/supabaseClient.js";

async function loadAllProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      short_description,
      image_gallery
    `)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const grid = document.getElementById("productsGrid");
  grid.innerHTML = "";

  data.forEach(p => {
    let imgUrl = "";

    if (Array.isArray(p.image_gallery) && p.image_gallery.length > 0) {
      imgUrl = supabase.storage
        .from("products")
        .getPublicUrl(p.image_gallery[0]).data.publicUrl;
    }

    grid.innerHTML += `
      <a href="product.html?slug=${p.slug}" class="product-card">
        <img src="${imgUrl}" alt="${p.name}">
        <h3>${p.name}</h3>
        <span class="price">₹${p.price}</span>
        <p class="desc">${p.short_description || ""}</p>
      </a>
    `;
  });
}

loadAllProducts();
