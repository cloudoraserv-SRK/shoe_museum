import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  try {
    const { pincode } = await req.json();

    const res = await fetch(
      `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`,
      {
        headers: {
          "Authorization": `Token ${Deno.env.get("DELHIVERY_KEY")}`
        }
      }
    );

    const data = await res.json();

    const serviceable = data?.delivery_codes?.length > 0;

    return new Response(
      JSON.stringify({
        serviceable,
        cod_available: serviceable,
        estimated_days: serviceable ? 3 : null
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});