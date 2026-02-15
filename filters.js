const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const filterBtn = document.getElementById("filterBtn");
const filterPanel = document.getElementById("filterPanel");

const brandChecks = document.querySelectorAll(".brand-filter");
const colorChecks = document.querySelectorAll(".color-filter");
const categoryChecks = document.querySelectorAll(".category-filter");
const priceRadios = document.querySelectorAll("input[name='price']");

// Toggle filter panel
filterBtn.addEventListener("click", () => {
  filterPanel.hidden = !filterPanel.hidden;
});

// Attach listeners
[
  searchInput,
  sortSelect,
  ...brandChecks,
  ...colorChecks,
  ...categoryChecks,
  ...priceRadios
].forEach(el => el.addEventListener("input", applyFilters));

function applyFilters() {
  let list = [...window.ALL_PRODUCTS];

  /* 🔍 SEARCH (optimized: name + brand + category + color) */
  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    list = list.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.brands?.slug?.replace("-", " ").toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.color?.toLowerCase().includes(q)
    );
  }

  /* 🏷 BRAND */
  const brands = [...brandChecks].filter(b => b.checked).map(b => b.value);
  if (brands.length) {
    list = list.filter(p => brands.includes(p.brands?.slug));
  }

  /* 🎨 COLOR */
  const colors = [...colorChecks].filter(c => c.checked).map(c => c.value);
  if (colors.length) {
    list = list.filter(p =>
      p.color && colors.includes(p.color.toLowerCase())
    );
  }

  /* 👟 CATEGORY */
  const cats = [...categoryChecks].filter(c => c.checked).map(c => c.value);
  if (cats.length) {
    list = list.filter(p =>
      p.category && cats.includes(p.category.toLowerCase())
    );
  }

  /* 💰 PRICE */
  const price = [...priceRadios].find(r => r.checked)?.value;
  if (price) {
    list = list.filter(p => {
      if (price === "0-1000") return p.price < 1000;
      if (price === "1000-3000") return p.price >= 1000 && p.price <= 3000;
      if (price === "3000+") return p.price > 3000;
    });
  }

  /* ↕ SORT */
  if (sortSelect.value === "price_low") {
    list.sort((a, b) => a.price - b.price);
  }
  if (sortSelect.value === "price_high") {
    list.sort((a, b) => b.price - a.price);
  }

  renderProducts(list);
}
