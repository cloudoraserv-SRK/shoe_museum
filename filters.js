document.addEventListener("DOMContentLoaded", () => {

  /* ================= ELEMENTS ================= */

  const searchInput   = document.getElementById("searchInput");
  const sortSelect    = document.getElementById("sortSelect");
  const filterPanel   = document.getElementById("filterPanel");
  const clearBtn      = document.getElementById("clearFilters");

  const searchToggle  = document.getElementById("searchToggle");
  const filterToggle  = document.getElementById("filterToggle");
  const hamburger     = document.getElementById("hamburger");

  const brandChecks   = document.querySelectorAll(".brand-filter");
  const colorChecks   = document.querySelectorAll(".color-filter");
  const categoryChecks= document.querySelectorAll(".category-filter");
  const priceRadios   = document.querySelectorAll("input[name='price']");


  /* ================= TOGGLES ================= */

  // Hamburger
  hamburger?.addEventListener("click", () => {
    document.querySelector(".nav-links")?.classList.toggle("active");
  });

  // Search dropdown
  searchToggle?.addEventListener("click", () => {
    const box = document.getElementById("searchBox");
    box.style.display =
      box.style.display === "block" ? "none" : "block";
  });

  // Filter panel
  filterToggle?.addEventListener("click", () => {
    filterPanel.hidden = !filterPanel.hidden;
  });


  /* ================= APPLY FILTERS ================= */

  function applyFilters() {

    if (!window.ALL_PRODUCTS) return;

    let list = [...window.ALL_PRODUCTS];

    /* 🔎 SEARCH */
    const q = searchInput?.value.trim().toLowerCase();

    if (q) {
      list = list.filter(p => {

        const nameMatch  = p.name?.toLowerCase().includes(q);
        const brandMatch = p.brands?.name?.toLowerCase().includes(q);
        const styleMatch = p.styles?.name?.toLowerCase().includes(q);

        const colorMatch = p.product_variants?.some(v =>
          v.color_name?.toLowerCase().includes(q)
        );

        const sizeMatch = p.product_variants?.some(v =>
          v.variant_stock?.some(s =>
            String(s.size).includes(q)
          )
        );

        return nameMatch || brandMatch || styleMatch || colorMatch || sizeMatch;
      });
    }


    /* 🏷 BRAND FILTER */
    const brands = [...brandChecks]
      .filter(b => b.checked)
      .map(b => b.value.toLowerCase());

    if (brands.length) {
      list = list.filter(p =>
        brands.includes(p.brands?.slug?.toLowerCase())
      );
    }


    /* 👟 CATEGORY FILTER */
    const styles = [...categoryChecks]
      .filter(c => c.checked)
      .map(c => c.value.toLowerCase());

    if (styles.length) {
      list = list.filter(p =>
        styles.includes(p.styles?.name?.toLowerCase())
      );
    }


    /* 🎨 COLOR FILTER */
    const colors = [...colorChecks]
      .filter(c => c.checked)
      .map(c => c.value.toLowerCase());

    if (colors.length) {
      list = list.filter(p =>
        p.product_variants?.some(v =>
          v.color_name &&
          colors.includes(v.color_name.toLowerCase())
        )
      );
    }


    /* 💰 PRICE FILTER */
    const price = [...priceRadios].find(r => r.checked)?.value;

    if (price) {
      list = list.filter(p => {
        if (price === "0-1000")   return p.price < 1000;
        if (price === "1000-3000")return p.price >= 1000 && p.price <= 3000;
        if (price === "3000+")    return p.price > 3000;
        return true;
      });
    }


    /* ↕ SORT */
    if (sortSelect?.value === "price_low") {
      list.sort((a, b) => a.price - b.price);
    }

    if (sortSelect?.value === "price_high") {
      list.sort((a, b) => b.price - a.price);
    }

    renderProducts(list);
  }


  /* ================= EVENTS ================= */

  searchInput?.addEventListener("input", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  [...brandChecks, ...colorChecks, ...categoryChecks, ...priceRadios]
    .forEach(el => el.addEventListener("change", applyFilters));


  /* ================= CLEAR FILTERS ================= */

  clearBtn?.addEventListener("click", () => {

    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "";

    brandChecks.forEach(b => b.checked = false);
    colorChecks.forEach(c => c.checked = false);
    categoryChecks.forEach(c => c.checked = false);
    priceRadios.forEach(r => r.checked = false);

    renderProducts(window.ALL_PRODUCTS);
  });

});
