import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {

  try {
    const { pincode } = await req.json();

    if (!pincode) {
      return new Response(
        JSON.stringify({ error: "Pincode required" }),
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Token ${Deno.env.get("DELHIVERY_KEY")}`
        }
      }
    );

    const data = await response.json();

    if (!data.delivery_codes?.length) {
      return new Response(
        JSON.stringify({ serviceable: false }),
        { status: 200 }
      );
    }

    const codAvailable =
      data.delivery_codes[0].postal_code.cod === "Y";

    return new Response(
      JSON.stringify({
        serviceable: true,
        cod: codAvailable,
        estimated_days: 4,
        shipping_charge: 0
      }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }

});