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

    if (!amount || !customer) {
      return new Response(JSON.stringify({
        error: "Missing amount or customer details"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const orderId = "ORDER_" + Date.now();

    // 1️⃣ Save order in DB
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
        amount: Number(amount),
        status: "pending"
      })
    });

    const CASHFREE_URL = "https://api.cashfree.com/pg/orders";

    const cfRes = await fetch(CASHFREE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": Deno.env.get("CASHFREE_APP_ID")!,
        "x-client-secret": Deno.env.get("CASHFREE_SECRET_KEY")!,
        "x-api-version": "2022-09-01"
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: "INR",
        customer_details: {
          customer_id: customer.id || orderId,
          customer_email: customer.email,
          customer_phone: customer.phone
        },
        order_meta: {
          return_url: `https://shoemuseumexclusive.cloud/products/payment-successful.html?order_id=${orderId}`
        }
      })
    });

    const cfData = await cfRes.json();
    console.log("Cashfree Response:", cfData);

    if (!cfRes.ok) {
      return new Response(JSON.stringify(cfData), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ✅ Correct field
    if (!cfData.payment_session_id) {
      return new Response(JSON.stringify({
        error: "Payment session not received",
        cashfree_response: cfData
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response(JSON.stringify({
      payment_session_id: cfData.payment_session_id
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    console.log("Server Error:", err);

    return new Response(JSON.stringify({
      error: "Payment creation failed",
      details: String(err)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
