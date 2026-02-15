import { supabase } from "./supabaseClient.js";

const container = document.getElementById("colorContainer");

async function loadProducts(){

  const { data: products } = await supabase
    .from("products")
    .select("id,name");

  // 🔹 get all unique available colors
  const { data: allColorsData } = await supabase
    .from("product_variants")
    .select("color_name");

  const availableColors = [
    ...new Set(
      (allColorsData || [])
        .map(c => c.color_name)
        .filter(Boolean)
    )
  ];

  container.innerHTML = "";

  for(const p of products){

    const { data: variants } = await supabase
      .from("product_variants")
      .select("id,image_gallery,color_name")
      .eq("product_id", p.id);

    if(!variants?.length) continue;

    let html = "";

    for(const v of variants){

      const imgPath = v.image_gallery?.[0];
      if(!imgPath) continue;

      const img = supabase.storage
        .from("products")
        .getPublicUrl(imgPath).data.publicUrl;

      html += `
        <div class="image-card" data-id="${v.id}">
          <img src="${img}">

          <div class="old-color">
            Current: <strong>${v.color_name || "Not Set"}</strong>
          </div>

          <select class="color-select">
            <option value="">Select Existing Color</option>
            ${availableColors.map(c =>
              `<option value="${c}">${c}</option>`
            ).join("")}
          </select>

          <input 
            type="text"
            placeholder="Or Add New Color"
            class="new-color-input"
          >

          <button class="btn update-btn">Update</button>
        </div>
      `;
    }

    container.insertAdjacentHTML("beforeend", `
      <div class="product-block">
        <div class="product-title">${p.name}</div>
        <div class="image-row">${html}</div>
      </div>
    `);
  }

  attachEvents();
}

function attachEvents(){

  document.querySelectorAll(".update-btn").forEach(btn=>{
    btn.onclick = async () => {

  const card = btn.closest(".image-card");
  const id = card.dataset.id;

  const selectedColor = card.querySelector(".color-select").value;
  const newColor = card.querySelector(".new-color-input").value.trim().toLowerCase();

  const finalColor = newColor || selectedColor;

  if(!finalColor){
    alert("Select or enter a color");
    return;
  }

  const { error } = await supabase
    .from("product_variants")
    .update({ color_name: finalColor })
    .eq("id", id);

  if(error){
    console.log(error);
    alert("Update failed");
    return;
  }

  alert("Color corrected successfully");
  loadProducts();
};

  });
}

loadProducts();
