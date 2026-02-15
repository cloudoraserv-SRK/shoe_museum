import { supabase } from './supabaseClient.js';

const qs = new URLSearchParams(location.search);
let productId = qs.get('product_id');

let currentVariantId = null;
let editId = null;

/* ELEMENTS */
const productSelect = document.getElementById('productSelect');
const colorInput = document.getElementById('colorInput');
const addColorBtn = document.getElementById('addColorBtn');
const colorList = document.getElementById('colorList');

const table = document.getElementById('variantsTable');
const sizeInput = document.getElementById('sizeInput');
const stockInput = document.getElementById('stockInput');
const saveSizeBtn = document.getElementById('saveSizeBtn');
const note = document.getElementById('selectedColorNote');

/* ================= PRODUCTS ================= */
async function loadProducts() {
  const { data } = await supabase
    .from('products')
    .select('id,name')
    .order('name');

  productSelect.innerHTML = data.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('');

  if (!productId) productId = data[0]?.id;
  productSelect.value = productId;

  loadColors();
}

productSelect.onchange = () => {
  productId = productSelect.value;
  currentVariantId = null;
  colorList.innerHTML = '';
  table.innerHTML = '';
  loadColors();
};

/* ================= COLORS ================= */
async function loadColors() {
  const { data } = await supabase
    .from('product_variants')
    .select('id,color_name')
    .eq('product_id', productId)
    .order('color_name');

  colorList.innerHTML = data.map(v => `
    <li>
      <button data-id="${v.id}" class="color-btn">${v.color_name}</button>
      <button data-del="${v.id}">✕</button>
    </li>
  `).join('');

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.onclick = () => {
      currentVariantId = btn.dataset.id;
      note.textContent = `Managing sizes for color: ${btn.innerText}`;
      loadSizes();
    };
  });

  document.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => deleteColor(btn.dataset.del);
  });
}

addColorBtn.onclick = async () => {
  if (!colorInput.value) return;

  await supabase.from('product_variants').insert({
    product_id: productId,
    color_name: colorInput.value.trim(),
    image_gallery: []
  });

  colorInput.value = '';
  loadColors();
};

async function deleteColor(id) {
  if (!confirm('Delete color?')) return;
  await supabase.from('product_variants').delete().eq('id', id);
  currentVariantId = null;
  table.innerHTML = '';
  loadColors();
}

/* ================= SIZES ================= */
async function loadSizes() {
  if (!currentVariantId) return;

  const { data } = await supabase
    .from('variant_stock')
    .select('*')
    .eq('variant_id', currentVariantId)
    .order('size');

  if (!data.length) {
    table.innerHTML = `<tr><td colspan="4">No sizes added</td></tr>`;
    return;
  }

  table.innerHTML = data.map(v => `
    <tr>
      <td>${v.size}</td>
      <td>${v.stock}</td>
      <td>${v.stock > 0 ? 'In Stock' : 'Out of Stock'}</td>
      <td>
        <button onclick="editSize('${v.id}','${v.size}',${v.stock})">Edit</button>
        <button onclick="deleteSize('${v.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

/* ================= ADD / EDIT SIZE ================= */
saveSizeBtn.onclick = async () => {
  if (!currentVariantId) return alert('Select color first');
  if (!sizeInput.value || stockInput.value === '') return;

  const payload = {
    variant_id: currentVariantId,
    size: sizeInput.value,
    stock: parseInt(stockInput.value)
  };

  if (editId) {
    await supabase.from('variant_stock').update(payload).eq('id', editId);
    editId = null;
  } else {
    await supabase.from('variant_stock').insert(payload);
  }

  sizeInput.value = '';
  stockInput.value = '';
  loadSizes();
};

window.editSize = (id, size, stock) => {
  editId = id;
  sizeInput.value = size;
  stockInput.value = stock;
};

window.deleteSize = async (id) => {
  if (!confirm('Delete size?')) return;
  await supabase.from('variant_stock').delete().eq('id', id);
  loadSizes();
};

/* INIT */
loadProducts();
