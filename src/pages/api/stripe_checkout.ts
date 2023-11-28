import { NextApiRequest, NextApiResponse } from "next";
import { execute_mongo_get, execute_mongo_post, execute_mongo_put } from "./[collection]";
import { COLLECTION } from "@/utils/query_api_method";
import { StripePrice } from "./[collection]/schemas";
const { STRIPE_SECRET_KEY_TEST, STRIPE_SECRET_KEY_LIVE } = process.env;
const stripe_test = require('stripe')(STRIPE_SECRET_KEY_TEST);
const stripe_live = require('stripe')(STRIPE_SECRET_KEY_LIVE);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const account_id = req.query.account_id as string;
    const identifier = req.query.identifier as string;
    const callback_url = req.query.callback_url as string | undefined;

    const stripe_prices = await execute_mongo_get(COLLECTION.STRIPE_PRICE, { identifier }, true) as StripePrice[];

    if (stripe_prices.length === 0) {
        res.status(400).send("Could not find any stripe price for: " + identifier);
        return;
    }
    if (stripe_prices.length > 1) {
        res.status(400).send("Found multiple stripe prices for: " + identifier);
        return;
    }

    const { stripe_price_id, mode, is_live } = stripe_prices[0];
    const _id = await execute_mongo_post(COLLECTION.STRIPE_PAYMENT, [{
        stripe_price_id,
        stripe_session_id: "",
        callback_url,
        account_id,
    }]).then(ids => ids[0]);

    const confirmation_url = process.env.NEXT_PUBLIC_API_PATH + "/stripe_checkout_confirmation?id=" + _id;
    const stripe = is_live ? stripe_live : stripe_test;
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: stripe_price_id,
                quantity: 1,
            },
        ],
        mode,
        success_url: confirmation_url,
        cancel_url: confirmation_url,
    });

    const { id: stripe_session_id } = session;
    await execute_mongo_put(COLLECTION.STRIPE_PAYMENT, { _id }, { stripe_session_id });

    res.redirect(303, session.url);
}