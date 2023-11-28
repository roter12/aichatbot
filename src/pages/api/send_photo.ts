import Telegram from "@/utils/interfaces/telegram";
import { COLLECTION } from "@/utils/query_api_method";
import wrap_api_function from "@/utils/wrap_api_function";
import { ObjectId } from "mongodb";
import { Chat, SalesBot } from "./[collection]/schemas";
import { get_db } from "@/utils/mongo";

async function get_subscribers(db: any) {
    const subscription_payments = await db.collection(COLLECTION.PAYMENT).find({
        is_paid: true,
        stripe_price_id: process.env.STRIPE_SUBSCRIPTION_PRICE_ID
    }).toArray();
    return subscription_payments.map((chat: any) => chat.reference);
}

async function execute(body: any) {
    const photo_url = body.url;
    const salesbot_id = new ObjectId(body.salesbot_id);
    const db = await get_db();
    const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: salesbot_id }) as SalesBot;

    const subscribers = await get_subscribers(db);
    console.log("Broadcasting image to: ", subscribers);

    for (const telegram_chat_id of subscribers) {
        const telegram = new Telegram(salesbot.settings.telegram_api_key);
        await telegram.send_image(photo_url, telegram_chat_id);
    }
}

export default wrap_api_function(execute);