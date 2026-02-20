import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json();

  const orderId = body?.data?.order?.order_id;
  const paymentStatus = body?.data?.payment?.payment_status;
  const paymentId = body?.data?.payment?.cf_payment_id;

  if (!orderId) {
    return new Response("Invalid payload", { status: 400 });
  }

  if (paymentStatus === "SUCCESS") {

    await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/orders?order_id=eq.${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify({
        status: "paid",
        payment_id: paymentId
      })
    });

  }

  if (paymentStatus === "FAILED") {

    await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/orders?order_id=eq.${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify({
        status: "failed"
      })
    });

  }

  return new Response("ok");
});