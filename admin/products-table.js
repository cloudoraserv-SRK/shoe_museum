import { supabase } from "./supabaseClient.js";

const tbody = document.getElementById("productsBody");

async function loadProducts() {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,name,price,mrp,active,
      brands!products_brand_id_fkey(name),
      categories!products_category_id_fkey(name)
    `)
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  tbody.innerHTML = "";

  for (const p of products) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("image_gallery")
      .eq("product_id", p.id);

    let img = "assets/images/placeholder.png";

    const v = (variants || []).find(
      x => Array.isArray(x.image_gallery) && x.image_gallery.length
    );

    if (v) {
      img = supabase.storage
        .from("products")
        .getPublicUrl(v.image_gallery[0]).data.publicUrl;
    }

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td><img src="${img}" width="50"></td>
        <td>${p.name}</td>
        <td>${p.brands?.name ?? "-"}</td>
        <td>${p.categories?.name ?? "-"}</td>
        <td>₹${p.price}</td>
        <td>₹${p.mrp ?? "-"}</td>
        <td>${p.active ? "✅" : "❌"}</td>
        <td>
          <button onclick="editProduct('${p.id}')">Edit</button>
          <button class="danger" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>
    `);
  }
}


window.editProduct = id => {
  location.href = `product-edit.html?id=${id}`;
};

window.deleteProduct = async id => {
  if (!confirm("Delete product?")) return;

  const { data: vars } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id);

  for (const v of vars || []) {
    await supabase.from("variant_stock").delete().eq("variant_id", v.id);
  }

  await supabase.from("product_variants").delete().eq("product_id", id);
  await supabase.from("products").delete().eq("id", id);

  loadProducts();
};

loadProducts();
