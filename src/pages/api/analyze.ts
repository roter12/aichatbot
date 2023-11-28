import Telegram, { execute_telegram } from "@/utils/interfaces/telegram2";
import { COLLECTION } from "@/utils/query_api_method";
import wrap_api_function from "@/utils/wrap_api_function";
import { ObjectId } from "mongodb";
import { SalesBot } from "./[collection]/schemas";
import { get_db } from "@/utils/mongo";

async function execute(body: any) {

    const { salesbot_id, telegram_chat_id } = body;

    const db = await get_db();
    const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: new ObjectId(salesbot_id) }) as SalesBot;
    const { telegram2_phone_number, telegram2_auth_code } = salesbot.settings;

    return await execute_telegram(telegram2_phone_number, telegram2_auth_code, async (telegram: Telegram) => {
        const chat_history = await telegram.get_chat_history(telegram_chat_id);
        const messages = chat_history.messages.map((message: any) => ({
            text: message.content.text?.formattedText?.text || message.content.text?.text || message.content.emoji,
            is_bot: message.is_outgoing,
        })
        );
        console.log(messages);
        return messages;
    })
}

export default wrap_api_function(execute);