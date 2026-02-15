import { supabase } from "./supabaseClient.js";

/* ===== ELEMENTS ===== */
const nameInput = document.getElementById("name");
const slugInput = document.getElementById("slug");
const mrpInput = document.getElementById("mrp");
const priceInput = document.getElementById("price");
const discountInput = document.getElementById("discount");
const shortDescInput = document.getElementById("shortDesc");
const longDescInput = document.getElementById("longDesc");
const activeInput = document.getElementById("active");

const brandSelect = document.getElementById("brand");
const categorySelect = document.getElementById("category");
const addBtn = document.getElementById("addProduct");

/* ===== LOAD BRANDS ===== */
async function loadBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("id,name")
    .order("name");

  if (error) return alert(error.message);

  brandSelect.innerHTML =
    `<option value="">Select Brand</option>` +
    data.map(b => `<option value="${b.id}">${b.name}</option>`).join("");
}

/* ===== LOAD CATEGORIES ===== */
async function loadCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name")
    .order("name");

  if (error) return alert(error.message);

  categorySelect.innerHTML =
    `<option value="">Select Category</option>` +
    data.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

/* ===== CREATE PRODUCT ===== */
addBtn.onclick = async () => {

  if (!nameInput.value.trim()) return alert("Name required");
  if (!slugInput.value.trim()) return alert("Slug required");
  if (!brandSelect.value) return alert("Select brand");
  if (!categorySelect.value) return alert("Select category");

  const payload = {
    name: nameInput.value.trim(),
    slug: slugInput.value.trim(),
    mrp: Number(mrpInput.value) || null,
    price: Number(priceInput.value) || null,
    discount: Number(discountInput.value) || 0,
    short_description: shortDescInput.value || null,
    long_description: longDescInput.value || null,
    brand_id: brandSelect.value,
    category_id: categorySelect.value,
    active: activeInput.checked
  };

  const { error } = await supabase
    .from("products")
    .insert(payload);

  if (error) {
    alert(error.message);
    return;
  }

  alert("✅ Product created");
  location.href = "products.html";
};

/* ===== INIT ===== */
loadBrands();
loadCategories();
