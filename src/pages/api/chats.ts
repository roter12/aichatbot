import { COLLECTION } from "@/utils/query_api_method";
import wrap_api_function from "@/utils/wrap_api_function";
import { execute_mongo_get } from "./[collection]";
import { Chat, SalesBot } from "./[collection]/schemas";
import Telegram, { execute_telegram } from "@/utils/interfaces/telegram2";

async function execute(body: any) {

    // const recent_chats = await execute_mongo_get(COLLECTION.CHAT, {}, true, 30, { created: -1 }) as Chat[];
    // const telegram_chat_ids = recent_chats.map(({ identifier }) => identifier);

    const salesbot = await execute_mongo_get(COLLECTION.SALESBOT, { _id: "64cf2c9834e8167515cfd3e5" }, false) as SalesBot;
    console.log(salesbot.settings.telegram2_phone_number)
    return await execute_telegram(salesbot.settings.telegram2_phone_number, salesbot.settings.telegram2_auth_code, async (telegram: Telegram) => {

        const telegram_chat_ids: number[] = await telegram.get_chats()
            .then(telegram_chat_ids => telegram_chat_ids.filter(telegram_chat_id => telegram_chat_id > 0));

        const users = [];
        for (const telegram_chat_id of telegram_chat_ids) {
            const user = await telegram.get_user(telegram_chat_id);
            users.push(user);
        }

        const usernames = users.map((user: any) => user.first_name + " " + user.last_name);

        return telegram_chat_ids.map((telegram_chat_id, index) => {
            return {
                telegram_chat_id,
                username: usernames[index]
            }
        });

    });
}

export default wrap_api_function(execute);