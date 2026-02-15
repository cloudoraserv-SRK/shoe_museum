import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {

  const id = new URLSearchParams(location.search).get("id");
  if (!id) return location.href = "products.html";

  /* ========= ELEMENTS ========= */
  const name = document.getElementById("name");
  const slug = document.getElementById("slug");
  const mrp = document.getElementById("mrp");
  const price = document.getElementById("price");
  const discount = document.getElementById("discount");
  const shortDesc = document.getElementById("shortDesc");
  const longDesc = document.getElementById("longDesc");
  const active = document.getElementById("active");
  const saveBtn = document.getElementById("saveProduct");

  const brand = document.getElementById("brand");
  const category = document.getElementById("category");

  const colorSelect = document.getElementById("colorSelect");
  const sizeList = document.getElementById("sizeList");

  const imageInput = document.getElementById("images");
  const imageGallery = document.getElementById("imageGallery");

  const style = document.getElementById("style");

  const variantsBtn = document.getElementById("variantsBtn");
  variantsBtn.href = `variants.html?product=${id}`;

  let variants = [];
  let currentVariant = null;

  /* ========= THUMBNAIL AUTO SAVE ========= */
  async function forceSetThumbnail(productId, gallery) {
    if (!gallery || !gallery.length) return;

    await supabase
      .from("products")
      .update({ thumbnail: gallery[0] })
      .eq("id", productId);
  }

  /* ========= LOAD PRODUCT ========= */
  async function loadProduct() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    name.value = data.name ?? "";
    slug.value = data.slug ?? "";
    mrp.value = data.mrp ?? "";
    price.value = data.price ?? "";
    discount.value = data.discount ?? "";
    shortDesc.value = data.short_description ?? "";
    longDesc.value = data.long_description ?? "";
    active.checked = !!data.active;

    await loadBrands(data.brand_id);
    await loadCategories(data.category_id);
    await loadVariants();
    await loadStyles(data.style_id);

  }

  async function loadBrands(selected) {
    const { data } = await supabase.from("brands").select("id,name");
    brand.innerHTML = data.map(b =>
      `<option value="${b.id}" ${b.id === selected ? "selected" : ""}>${b.name}</option>`
    ).join("");
  }

  async function loadCategories(selected) {
    const { data } = await supabase.from("categories").select("id,name");
    category.innerHTML = data.map(c =>
      `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${c.name}</option>`
    ).join("");
  }
async function loadStyles(selected) {
  const { data } = await supabase.from("styles").select("id,name");
  style.innerHTML = data.map(s =>
    `<option value="${s.id}" ${s.id === selected ? "selected" : ""}>
      ${s.name}
    </option>`
  ).join("");
}

  /* ========= VARIANTS ========= */
  async function loadVariants() {
    const { data } = await supabase
      .from("product_variants")
      .select("id,color_name,image_gallery")
      .eq("product_id", id);

    variants = data || [];

    if (!variants.length) {
      colorSelect.innerHTML = `<option>No colors</option>`;
      return;
    }

    colorSelect.innerHTML = variants
      .map((v, i) => `<option value="${i}">${v.color_name}</option>`)
      .join("");

    colorSelect.value = 0;
    selectVariant();
  }

  function selectVariant() {
    currentVariant = variants[Number(colorSelect.value)];
    if (!currentVariant) return;

    if (typeof currentVariant.image_gallery === "string") {
      try {
        currentVariant.image_gallery = JSON.parse(currentVariant.image_gallery);
      } catch {
        currentVariant.image_gallery = [];
      }
    }

    if (!Array.isArray(currentVariant.image_gallery)) {
      currentVariant.image_gallery = [];
    }

    renderImages();
    loadSizes();

    // 🔥 ENSURE THUMBNAIL ALWAYS EXISTS
    if (currentVariant.image_gallery.length) {
      forceSetThumbnail(id, currentVariant.image_gallery);
    }
  }

  colorSelect.onchange = selectVariant;

  /* ========= IMAGES ========= */
  function renderImages() {
    imageGallery.innerHTML = "";

    currentVariant.image_gallery.forEach((path, i) => {
      const url = supabase.storage
        .from("products")
        .getPublicUrl(path).data.publicUrl;

      imageGallery.innerHTML += `
        <div class="img-box">
          <img src="${url}" width="100">
          <button data-i="${i}" class="remove-img">✕</button>
        </div>`;
    });

    imageGallery.querySelectorAll(".remove-img").forEach(btn => {
      btn.onclick = () => removeImage(+btn.dataset.i);
    });
  }

  imageInput.onchange = async () => {
    if (!currentVariant) return alert("Select color first");

    const gallery = [...currentVariant.image_gallery];

    for (const file of imageInput.files) {
      const safe = file.name.replace(/\s+/g, "-").toLowerCase();
      const path = `${slug.value}/${currentVariant.color_name}/${Date.now()}-${safe}`;

      await supabase.storage.from("products").upload(path, file, { upsert: true });
      gallery.push(path);
    }

    await supabase
      .from("product_variants")
      .update({ image_gallery: gallery })
      .eq("product_id", id)
      .eq("color_name", currentVariant.color_name);

    currentVariant.image_gallery = gallery;
    imageInput.value = "";
    renderImages();

    // 🔥 FORCE thumbnail update
    await forceSetThumbnail(id, gallery);
  };

  async function removeImage(i) {
    const path = currentVariant.image_gallery[i];
    await supabase.storage.from("products").remove([path]);

    const updated = currentVariant.image_gallery.filter((_, idx) => idx !== i);

    await supabase
      .from("product_variants")
      .update({ image_gallery: updated })
      .eq("product_id", id)
      .eq("color_name", currentVariant.color_name);

    currentVariant.image_gallery = updated;
    renderImages();

    if (updated.length) {
      await forceSetThumbnail(id, updated);
    }
  }

  /* ========= SIZES ========= */
  async function loadSizes() {
    sizeList.innerHTML = "";

    const { data } = await supabase
      .from("variant_stock")
      .select("size,stock")
      .eq("variant_id", currentVariant.id)
      .order("size");

    data?.forEach(s => {
      sizeList.innerHTML += `<div>Size ${s.size} | Stock ${s.stock}</div>`;
    });
  }

  /* ========= SAVE PRODUCT ========= */
  saveBtn.onclick = async () => {
    await supabase.from("products")
      .update({
        name: name.value,
        slug: slug.value,
        mrp: mrp.value,
        price: price.value,
        discount: discount.value || null,
        short_description: shortDesc.value,
        long_description: longDesc.value,
        active: active.checked,
        brand_id: brand.value,
        category_id: category.value,
        style_id: style.value   // 👈 ADD THIS
      })
      .eq("id", id);

    alert("✅ Product saved");
  };

  /* ========= SYNC IMAGES ========= */
  document.getElementById("syncImagesBtn").onclick = async () => {
    if (!currentVariant) return alert("Select color first");

    const folder = `${slug.value}/${currentVariant.color_name}`;
    const { data } = await supabase.storage.from("products").list(folder);

    const paths = (data || []).map(f => `${folder}/${f.name}`);

    await supabase
      .from("product_variants")
      .update({ image_gallery: paths })
      .eq("product_id", id)
      .eq("color_name", currentVariant.color_name);

    currentVariant.image_gallery = paths;
    renderImages();

    await forceSetThumbnail(id, paths);
  };

  loadProduct();
});
