// server.js
require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // serve index.html / product.html + assets

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if(!stripeSecret){
  console.warn('⚠️ ATTENZIONE: imposta STRIPE_SECRET_KEY nel file .env prima di usare il checkout.');
}
const stripe = Stripe(stripeSecret);

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;
    if(!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({error:'Nessun articolo nel carrello'});
    }

    const line_items = items.map(it => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: it.title,
          images: it.image ? [it.image] : []
        },
        unit_amount: Math.round(Number(it.price)) // in cents
      },
      quantity: Number(it.qty || 1)
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: (process.env.SUCCESS_URL || 'http://localhost:5000/success.html') + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: (process.env.CANCEL_URL || 'http://localhost:5000/product.html'),
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`🚀 Server avviato su http://localhost:${PORT}`));
