import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {

    const body = await req.json();

    const waybill = body?.waybill;
    const status = body?.status; // Delivered / In Transit etc

    if (!waybill) {
      return new Response("Invalid payload", { status: 400 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    await fetch(
      `${SUPABASE_URL}/rest/v1/orders?tracking_id=eq.${waybill}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({
          shipment_status: status
        })
      }
    );

    return new Response("Updated");

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }

});
