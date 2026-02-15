import { supabase } from "./supabaseClient.js";

/* 🔐 PROTECT PAGE */
const { data } = await supabase.auth.getUser();

if (!data.user) {
  location.href = "login.html";
}

/* LOGOUT BUTTON (OPTIONAL) */
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.href = "login.html";
});


/* =========================
   LOAD ORDERS
========================= */

async function loadOrders() {
const { data: orders, error } = await supabase
  .from("orders")
  .select(`
    id,
    total,
    status,
    created_at,
    customers (
      name,
      email,
      phone
    ),
    order_items (
      quantity,
      price,
      products (
        name
      )
    )
  `)
  .order("created_at", { ascending: false });

  const box = document.getElementById("orders");
  box.innerHTML = "";

  data.forEach(o => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p>
        <b>${o.id}</b><br>
        ₹${o.total} — 
        <select data-id="${o.id}">
          <option ${o.status==="pending"?"selected":""}>pending</option>
          <option ${o.status==="paid"?"selected":""}>paid</option>
          <option ${o.status==="shipped"?"selected":""}>shipped</option>
          <option ${o.status==="delivered"?"selected":""}>delivered</option>
        </select>
      </p>
    `;
    box.appendChild(div);
  });

  document.querySelectorAll("select").forEach(sel => {
    sel.onchange = async () => {
      await supabase
        .from("orders")
        .update({ status: sel.value })
        .eq("id", sel.dataset.id);
    };
  });
}

loadOrders();

/* =========================
   ADD PRODUCT
========================= */

addProductBtn.onclick = async () => {
  await supabase.from("products").insert({
    name: pName.value,
    slug: pSlug.value,
    price: pPrice.value,
    image: pImage.value,
    description: pDesc.value,
    energy: pEnergy.value
  });

  alert("Product added");
};

if (data.user.email !== "dngmarineservices955@gmail.com") {
  await supabase.auth.signOut();
  location.href = "login.html";
}
const ordersBox = document.getElementById("orders");
ordersBox.innerHTML = "";

orders.forEach(order => {
  const wrapper = document.createElement("div");
  wrapper.className = "order-card";

  let itemsHTML = "";
  order.order_items.forEach(item => {
    itemsHTML += `
      <li>
        ${item.products.name}
        <span>× ${item.quantity}</span>
        <span>₹${item.price}</span>
      </li>
    `;
  });

  wrapper.innerHTML = `
    <div class="order-header">
      <div>
        <strong>Order ID:</strong> ${order.id}<br>
        <small>${new Date(order.created_at).toLocaleString()}</small>
      </div>

      <select data-id="${order.id}">
        <option ${order.status==="pending"?"selected":""}>pending</option>
        <option ${order.status==="paid"?"selected":""}>paid</option>
        <option ${order.status==="shipped"?"selected":""}>shipped</option>
        <option ${order.status==="delivered"?"selected":""}>delivered</option>
      </select>
    </div>

    <div class="order-customer">
      👤 ${order.customers.name}<br>
      📧 ${order.customers.email}<br>
      📞 ${order.customers.phone}
    </div>

    <ul class="order-items">
      ${itemsHTML}
    </ul>

    <div class="order-total">
      Total: ₹${order.total}
    </div>
  `;

  ordersBox.appendChild(wrapper);
});
document.querySelectorAll("select").forEach(sel => {
  sel.onchange = async () => {
    await supabase
      .from("orders")
      .update({ status: sel.value })
      .eq("id", sel.dataset.id);
  };
});
