import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  try {

    const { amount, customer } = await req.json();

    // 🔥 Generate Order ID
    const orderId = "ORDER_" + Date.now();

    // 🔹 1️⃣ Save order as pending in DB
    await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify({
        order_id: orderId,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        amount,
        status: "pending"
      })
    });

    // 🔹 2️⃣ Create Cashfree Order
    const cfRes = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": Deno.env.get("CASHFREE_APP_ID")!,
        "x-client-secret": Deno.env.get("CASHFREE_SECRET_KEY")!,
        "x-api-version": "2022-09-01"
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: customer.id,
          customer_email: customer.email,
          customer_phone: customer.phone
        },
        order_meta: {
          return_url:
            "https://shoemuseumexclusive.cloud/payment-success?order_id=" + orderId
        }
      })
    });

    const cfData = await cfRes.json();

    return new Response(JSON.stringify({
      payment_link: cfData.payment_link
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {

    return new Response(JSON.stringify({
      error: "Payment creation failed"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  }

});