import wrap_api_function from "@/utils/wrap_api_function";
import { execute_mongo_get } from "./[collection]";
import { SalesBot } from "./[collection]/schemas";
import { COLLECTION } from "@/utils/query_api_method";
import Telegram, { execute_telegram } from "@/utils/interfaces/telegram2";
const tdl = require('tdl')
const { getTdjson } = require('prebuilt-tdlib')

var is_initialized = false;

async function execute() {

    if (is_initialized) return;
    is_initialized = true;

    tdl.configure({ tdjson: getTdjson() })

    const salesbot = await execute_mongo_get(COLLECTION.SALESBOT, { _id: "64c3c71b0338812081391c5e" }, false) as SalesBot;

    await execute_telegram(salesbot.settings.telegram2_phone_number, salesbot.settings.telegram2_authcode, async (telegram: Telegram) => {
        const chats = await telegram.get_chats();
    });

}

export default wrap_api_function(execute);