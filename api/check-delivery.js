import fetch from "node-fetch";

export default async function handler(req, res) {

  const { pincode } = req.query;

  if (!pincode) {
    return res.status(400).json({ error: "Pincode required" });
  }

  try {

    const response = await fetch(
      `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`,
      {
        headers: {
          "Authorization": "5deb1f5ef0deae7cd7b65f8741c1f3a"
        }
      }
    );

    const data = await response.json();

    if (!data.delivery_codes?.length) {
      return res.json({ serviceable: false });
    }

    const cod = data.delivery_codes[0].postal_code.cod;

    res.json({
      serviceable: true,
      cod_available: cod,
      estimated_days: 4   // can calculate properly later
    });

  } catch (err) {
    res.status(500).json({ error: "API error" });
  }
}
