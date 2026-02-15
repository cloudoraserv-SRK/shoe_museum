import { supabase } from "./supabaseClient.js";
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

/* helpers */
const toInt = v => Math.round(Number(v) || 0);
const splitSafe = v => String(v || "").split("|").map(x => x.trim()).filter(Boolean);

async function getIdByName(table, name) {
  if (!name) return null;
  const { data } = await supabase
    .from(table)
    .select("id")
    .ilike("name", name)
    .limit(1)
    .single();
  return data?.id || null;
}

/* elements */
const fileInput = document.getElementById("excelFile");
const previewBtn = document.getElementById("previewBtn");
const uploadBtn = document.getElementById("uploadBtn");
const table = document.getElementById("previewTable");
const log = document.getElementById("log");
const progress = document.getElementById("progress");

let rows = [];

/* PREVIEW */
previewBtn.onclick = async () => {
  const buf = await fileInput.files[0].arrayBuffer();
  const wb = XLSX.read(buf);
  rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  render(rows);
};

function render(data) {
  table.querySelector("thead").innerHTML =
    `<tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join("")}</tr>`;
  table.querySelector("tbody").innerHTML = data.map(r => `
    <tr>${Object.keys(r).map(k =>
      `<td contenteditable data-k="${k}">${r[k] ?? ""}</td>`
    ).join("")}</tr>
  `).join("");
}

function getRows() {
  return [...table.querySelectorAll("tbody tr")].map(tr => {
    const r = {};
    tr.querySelectorAll("td").forEach(td => r[td.dataset.k] = td.innerText.trim());
    return r;
  });
}

/* UPLOAD */
uploadBtn.onclick = async () => {
  const data = getRows();
  progress.max = data.length;
  progress.value = 0;
  log.textContent = "";

  for (const r of data) {
    try {
      const brand_id = await getIdByName("brands", r.brand);
      const category_id = await getIdByName("categories", r.category);
      const style_id = await getIdByName("styles", r.style);

      const mrp = toInt(r.mrp);
      const price = toInt(r.price);
      const discount = mrp - price;

      const { data: product, error: pErr } = await supabase
        .from("products")
        .upsert({
          slug: r.slug,
          name: r.name,
          brand_id,
          category_id,
          style_id,
          mrp,
          price,
          discount,
          active: String(r.active).toUpperCase() === "TRUE"
        }, { onConflict: "slug" })
        .select("id")
        .single();

      if (pErr) throw pErr;

      for (const color of splitSafe(r.color)) {

  const { data: variant, error: vErr } = await supabase
    .from("product_variants")
    .insert({
      product_id: product.id,
      color_name: color,
      image_gallery: []
    })
    .select("id")
    .single();

  if (vErr) throw vErr;

  for (const size of splitSafe(r.sizes)) {
    await supabase
      .from("variant_stock")
      .insert({
        variant_id: variant.id,
        size,
        stock: toInt(r.stock)
      });
  }
}

      log.textContent += `✅ ${r.slug}\n`;
    } catch (e) {
      log.textContent += `❌ ${r.slug} → ${e.message}\n`;
    }
    progress.value++;
  }

  log.textContent += "\nDONE 🎉";
};
