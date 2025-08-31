import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { items } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: "Nessun articolo" });

  try {
    const line_items = items.map(it => ({
      price_data: {
        currency: "eur",
        product_data: { name: it.title, images: it.image ? [it.image] : [] },
        unit_amount: Number(it.price),
      },
      quantity: Number(it.qty || 1),
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CANCEL_URL}`,
      shipping_address_collection: {
        allowed_countries: ["IT", "US", "DE", "FR"],
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
