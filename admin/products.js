import { supabase } from "./supabaseClient.js";

const list = document.getElementById("productsList");

async function loadProducts() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Failed to load products");
    return;
  }

  list.innerHTML = "";

  for (let p of products) {

    const { data: variants } = await supabase
      .from("product_variants")
      .select("color_name, image_gallery")
      .eq("product_id", p.id);

    let imgHtml = `<div class="imgs empty">No image</div>`;

    const v = variants?.find(
      v => Array.isArray(v.image_gallery) && v.image_gallery.length > 0
    );

    if (v) {
      const url = supabase.storage
        .from("products")
        .getPublicUrl(v.image_gallery[0]).data.publicUrl;

      imgHtml = `<div class="imgs"><img src="${url}"></div>`;
    }

    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      ${imgHtml}
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="editProduct('${p.id}')">Edit</button>
        <button class="danger" onclick="deleteProduct('${p.id}')">Delete</button>
      </div>
    `;

    list.appendChild(div);
  }
}

/* ACTIONS */
window.editProduct = (id) => {
  location.href = `product-edit.html?id=${id}`;
};

window.deleteProduct = async (id) => {
  if (!confirm("Delete product?")) return;

  const { data: vars } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id);

  for (let v of vars || []) {
    await supabase.from("variant_stock").delete().eq("variant_id", v.id);
  }

  await supabase.from("product_variants").delete().eq("product_id", id);
  await supabase.from("products").delete().eq("id", id);

  loadProducts();
};

loadProducts();
