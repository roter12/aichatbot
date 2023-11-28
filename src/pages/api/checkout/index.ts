import { COLLECTION, mongo_post, mongo_put } from "@/utils/query_api_method";
import { NextApiRequest, NextApiResponse } from "next";
import { execute_mongo_post } from "../[collection]";
const { NEXT_PUBLIC_API_PATH, STRIPE_SECRET_KEY } = process.env;
const stripe = require('stripe')(STRIPE_SECRET_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const prices = process.env.NEXT_PUBLIC_STRIPE_DEPOSIT_PRICES!.split(",").map((price: string) => parseInt(price));

    const PRICES = {
        'subscription': process.env.STRIPE_SUBSCRIPTION_PRICE_ID,
        ...Object.fromEntries(prices.map((price: number) => [`deposit${price}`, process.env[`STRIPE_DEPOSIT_PRICE_ID_${price}`]])),
        'custom': process.env.STRIPE_CUSTOM_PRICE_ID,
        'video': process.env.STRIPE_VIDEO_PRICE_ID,
    } as any;

    const reference = req.query.reference as string;
    const product = (req.query.product as string) + (req.query.amount || "") as string;
    const platform = req.query.platform as string;
    const forward = req.query.forward as string | undefined;

    if (!Object.keys(PRICES).includes(product)) {
        res.status(400).send("Invalid product: " + product);
        return;
    }

    const price = PRICES[product];
    const mode = product === 'subscription' ? 'subscription' : 'payment';

    const amount = parseInt((req.query.amount || "0") as string) * 100;

    const id = await execute_mongo_post(COLLECTION.PAYMENT, [{
        amount,
        reference,
        stripe_price_id: price,
        platform,
    }]).then((array: any) => array ? array[0] : null)

    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price,
                quantity: 1,
            },
        ],
        mode,
        success_url: `${NEXT_PUBLIC_API_PATH}/checkout/${id}/success${forward ? `?forward=${forward}` : ""}`,
        cancel_url: `${NEXT_PUBLIC_API_PATH}/checkout/${id}/cancel`,
    });

    await mongo_put(COLLECTION.PAYMENT, { _id: id }, { stripe_session_id: session.id });

    res.redirect(303, session.url);
}