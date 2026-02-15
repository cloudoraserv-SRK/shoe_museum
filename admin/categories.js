import { supabase } from "./supabaseClient.js";

const nameInput = document.getElementById("categoryName");
const slugInput = document.getElementById("categorySlug");
const saveBtn = document.getElementById("saveCategory");
const body = document.getElementById("categoryBody");

let editId = null;

/* AUTO SLUG */
nameInput.oninput = () => {
  slugInput.value = nameInput.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

/* LOAD */
async function loadCategories() {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  body.innerHTML = "";

  data.forEach(c => {
    body.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>${c.slug}</td>
        <td class="actions">
          <button onclick="editCategory('${c.id}','${c.name}','${c.slug}')">Edit</button>
          <button class="danger" onclick="deleteCategory('${c.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

/* ADD / UPDATE */
saveBtn.onclick = async () => {
  if (!nameInput.value || !slugInput.value) return alert("Fill fields");

  await supabase.from("categories").upsert({
    id: editId || undefined,
    name: nameInput.value.trim(),
    slug: slugInput.value.trim()
  });

  reset();
  loadCategories();
};

function reset() {
  editId = null;
  nameInput.value = "";
  slugInput.value = "";
}

/* EDIT */
window.editCategory = (id, name, slug) => {
  editId = id;
  nameInput.value = name;
  slugInput.value = slug;
};

/* DELETE */
window.deleteCategory = async (id) => {
  if (!confirm("Delete category?")) return;
  await supabase.from("categories").delete().eq("id", id);
  loadCategories();
};

loadCategories();
