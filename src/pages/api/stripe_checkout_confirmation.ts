import { COLLECTION, mongo_get } from "@/utils/query_api_method";
import wrap_api_function from "@/utils/wrap_api_function";
import { execute_mongo_get, execute_mongo_put } from "./[collection]";
import { NextApiRequest, NextApiResponse } from "next";
import { StripePayment, StripePrice } from "./[collection]/schemas";
const stripe_test = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);
const stripe_live = require('stripe')(process.env.STRIPE_SECRET_KEY_LIVE);

async function execute(body: any, req: NextApiRequest, res: NextApiResponse) {
    const id = body.id;

    const stripe_payment = await execute_mongo_get(COLLECTION.STRIPE_PAYMENT, { _id: id }, false) as StripePayment;
    const stripe_session_id = stripe_payment.stripe_session_id;
    const stripe_price = await execute_mongo_get(COLLECTION.STRIPE_PRICE, { stripe_price_id: stripe_payment.stripe_price_id }, false) as StripePrice;
    const stripe = stripe_price.is_live ? stripe_live : stripe_test;
    const session = await stripe.checkout.sessions.retrieve(stripe_session_id);

    if (!stripe_payment.is_paid && session.payment_status == 'paid') {
        await execute_mongo_put(COLLECTION.STRIPE_PAYMENT, { _id: id }, { is_paid: true });
    }

    if (session.payment_status == 'paid') {
        if (!stripe_payment.is_paid) {
            await execute_mongo_put(COLLECTION.STRIPE_PAYMENT, { _id: id }, { is_paid: true });
        }
        res.redirect(307, stripe_payment.callback_url);
        return;
    }
    return {
        status: session.payment_status
    }
}
export default wrap_api_function(execute);