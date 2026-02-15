import { supabase } from "./supabaseClient.js";

const tbody = document.getElementById("editorBody");
const updateAllBtn = document.getElementById("updateAllBtn");

async function loadProducts() {

  const { data: brands } = await supabase.from("brands").select("id,name");
  const { data: categories } = await supabase.from("categories").select("id,name");
  const { data: styles } = await supabase.from("styles").select("id,name");

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  tbody.innerHTML = "";

  for (const p of products) {

  // 🔹 Fetch first variant image
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
    <tr data-id="${p.id}">
      <td><img src="${img}" width="50"></td>

      <td><input value="${p.name}" class="edit-name"></td>

      <td>
        <select class="edit-brand">
          ${brands.map(b =>
            `<option value="${b.id}" ${b.id===p.brand_id?"selected":""}>
              ${b.name}
            </option>`).join("")}
        </select>
      </td>

      <td>
        <select class="edit-category">
          ${categories.map(c =>
            `<option value="${c.id}" ${c.id===p.category_id?"selected":""}>
              ${c.name}
            </option>`).join("")}
        </select>
      </td>

      <td>
        <select class="edit-style">
          ${styles.map(s =>
            `<option value="${s.id}" ${s.id===p.style_id?"selected":""}>
              ${s.name}
            </option>`).join("")}
        </select>
      </td>

      <td><input type="number" value="${p.price}" class="edit-price"></td>
      <td><input type="number" value="${p.mrp ?? ""}" class="edit-mrp"></td>
      <td><input type="checkbox" class="edit-active" ${p.active?"checked":""}></td>
      <td><button class="save-btn">Update</button></td>
    </tr>
  `);
}


  document.querySelectorAll(".save-btn").forEach(btn=>{
    btn.onclick = () => updateRow(btn.closest("tr"));
  });
}

async function updateRow(row){

  const id = row.dataset.id;

  const updated = {
    name: row.querySelector(".edit-name").value,
    brand_id: row.querySelector(".edit-brand").value,
    category_id: row.querySelector(".edit-category").value,
    style_id: row.querySelector(".edit-style").value,
    price: +row.querySelector(".edit-price").value,
    mrp: +row.querySelector(".edit-mrp").value || null,
    active: row.querySelector(".edit-active").checked
  };

  await supabase.from("products").update(updated).eq("id", id);
}

updateAllBtn.onclick = async () => {
  const rows = document.querySelectorAll("#editorBody tr");

  for(const row of rows){
    await updateRow(row);
  }

  alert("All products updated successfully");
};

loadProducts();
