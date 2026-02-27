import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {

    const body = await req.json();

    const orderId = body?.data?.order?.order_id;
    const paymentStatus = body?.data?.payment?.payment_status;
    const paymentId = body?.data?.payment?.cf_payment_id;

    if (!orderId) {
      return new Response("Invalid payload", { status: 400 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 🔎 Get existing order
    const orderRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?order_id=eq.${orderId}`,
      {
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`
        }
      }
    );

    const orderData = await orderRes.json();
    const order = orderData[0];

    if (!order) {
      return new Response("Order not found", { status: 404 });
    }

    // ❌ If payment failed
    if (paymentStatus === "FAILED") {

      await fetch(
        `${SUPABASE_URL}/rest/v1/orders?order_id=eq.${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": SERVICE_KEY,
            "Authorization": `Bearer ${SERVICE_KEY}`
          },
          body: JSON.stringify({
            status: "failed",
            payment_status: "failed"
          })
        }
      );

      return new Response("Payment failed handled");
    }

    // ✅ If payment success
    if (paymentStatus === "SUCCESS") {

      // 🔁 Prevent duplicate shipment
      if (order.shipment_status === "shipped") {
        return new Response("Already shipped");
      }

      // 1️⃣ Update payment status
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders?order_id=eq.${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": SERVICE_KEY,
            "Authorization": `Bearer ${SERVICE_KEY}`
          },
          body: JSON.stringify({
            status: "paid",
            payment_status: "success",
            payment_id: paymentId
          })
        }
      );

      // 2️⃣ Create Delhivery shipment
      const delhiveryRes = await fetch(
        "https://track.delhivery.com/api/cmu/create.json",
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${Deno.env.get("DELHIVERY_KEY")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            shipments: [{
              name: order.customer_name,
              add: order.address,
              city: order.city,
              pin: order.pincode,
              phone: order.customer_phone,
              order: order.order_id,
              payment_mode: "Prepaid",
              total_amount: order.amount
            }],
            pickup_location: "Primary"
          })
        }
      );

      const delhiveryData = await delhiveryRes.json();

      const trackingId =
        delhiveryData?.packages?.[0]?.waybill || null;

      if (trackingId) {

        // 3️⃣ Save tracking ID
        await fetch(
          `${SUPABASE_URL}/rest/v1/orders?order_id=eq.${orderId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "apikey": SERVICE_KEY,
              "Authorization": `Bearer ${SERVICE_KEY}`
            },
            body: JSON.stringify({
              tracking_id: trackingId,
              shipment_status: "shipped",
              courier_name: "Delhivery"
            })
          }
        );

      }

      return new Response("Payment + Shipment processed");
    }

    return new Response("Unhandled status");

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }

});
