import { COLLECTION, mongo_get } from "@/utils/query_api_method";
import wrap_api_function from "@/utils/wrap_api_function";
import { execute_mongo_get, execute_mongo_put } from "../../[collection]";
import { Payment, SalesBot } from "../../[collection]/schemas";
import Telegram from "@/utils/interfaces/telegram2";
import Instagram from "@/utils/interfaces/instagram";
import { NextApiRequest, NextApiResponse } from "next";
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function get_price_id(session_id: string) {
    try {
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['line_items'],
        });

        // Each session can have multiple line items. Let's just take the first one for this example.
        const firstLineItem = session.line_items.data[0];

        if (firstLineItem) {
            const priceId = firstLineItem.price.id;
            console.log(priceId);
            return priceId;
        } else {
            console.log("No line items found");
        }

    } catch (err) {
        console.error(err);
    }
}

function is_subscription(price_id: string) {
    return price_id === process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
}

const MESSAGE_SUBSCRIPTION = "Hello my naughty boy, welcome to my VIP channel 😈 You will find the hottest content here everyday 🔥 I can't wait to show you what I have in store for you 💋"
const MESSAGE_DEPOSIT = "Hey babe 😉 thank you for your payment. 💋"

async function execute(body: any, req: NextApiRequest, res: NextApiResponse) {
    const id = body.id;
    const forward = body.forward as string | undefined;

    const payment = await execute_mongo_get(COLLECTION.PAYMENT, { _id: id }, false) as Payment;
    const stripe_session_id = payment.stripe_session_id;
    const session = await stripe.checkout.sessions.retrieve(stripe_session_id);
    const price_id = await get_price_id(stripe_session_id!);

    if (!payment.is_paid && session.payment_status == 'paid') {
        await execute_mongo_put(COLLECTION.PAYMENT, { _id: id }, { is_paid: true });

        const message = is_subscription(price_id) ? MESSAGE_SUBSCRIPTION : MESSAGE_DEPOSIT;

        if (payment.platform === "instagram") {
            const salesbot = await execute_mongo_get(COLLECTION.SALESBOT, { _id: process.env.DEFAULT_SALESBOT }, false) as SalesBot;
            const instagram: Instagram = new Instagram(salesbot.settings.instagram_api_key!, salesbot.settings.instagram_page_id!);
            await instagram.send_text(message, payment.reference);
        } else {
            if (is_telegram_chat_id(payment.reference)) {
                const telegram = new Telegram();
                await telegram.send_text(message, payment.reference);
                await new Promise(resolve => setTimeout(resolve, 1000));
                await telegram.destroy();
            }
        }

    }
    if (session.payment_status == 'paid') {
        if (forward) {
            // forward to forward url
            res.redirect(307, forward);
            return;
        }
        return "Thank you, we received your payment. You can now go back to Telegram to chat with Anastasia";
    }
    return {
        status: session.payment_status
    }
}

function is_telegram_chat_id(reference: string) {
    return (reference + "").match(/^[0-9]+$/);
}

export default wrap_api_function(execute);