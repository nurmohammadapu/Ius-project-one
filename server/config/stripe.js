const Stripe = require("stripe");
require("dotenv").config();

exports.stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
