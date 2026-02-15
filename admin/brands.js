import { supabase } from "./supabaseClient.js";

const nameInput = document.getElementById("brandName");
const slugInput = document.getElementById("brandSlug");
const addBtn = document.getElementById("addBrand");
const body = document.getElementById("brandBody");

let editId = null;

/* AUTO SLUG */
nameInput.oninput = () => {
  slugInput.value = nameInput.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

/* LOAD BRANDS */
async function loadBrands() {
  const { data } = await supabase
    .from("brands")
    .select("*")
    .order("name");

  body.innerHTML = "";

  data.forEach(b => {
    body.innerHTML += `
      <tr>
        <td>${b.name}</td>
        <td>${b.slug}</td>
        <td class="actions">
          <button onclick="editBrand('${b.id}','${b.name}','${b.slug}')">Edit</button>
          <button class="danger" onclick="deleteBrand('${b.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

/* ADD / UPDATE */
addBtn.onclick = async () => {
  if (!nameInput.value || !slugInput.value) return alert("Fill fields");

  await supabase.from("brands").upsert({
    id: editId || undefined,
    name: nameInput.value.trim(),
    slug: slugInput.value.trim()
  });

  resetForm();
  loadBrands();
};

function resetForm() {
  editId = null;
  nameInput.value = "";
  slugInput.value = "";
}

/* EDIT */
window.editBrand = (id, name, slug) => {
  editId = id;
  nameInput.value = name;
  slugInput.value = slug;
};

/* DELETE */
window.deleteBrand = async (id) => {
  if (!confirm("Delete brand?")) return;
  await supabase.from("brands").delete().eq("id", id);
  loadBrands();
};

loadBrands();
