import wrap_api_function from "@/utils/wrap_api_function";
import { execute_mongo_put } from "./[collection]";
import { COLLECTION } from "@/utils/query_api_method";
import Telegram from "@/utils/interfaces/telegram2";
import { ObjectId } from "mongodb";
import { get_db } from "@/utils/mongo";
import { SalesBot } from "./[collection]/schemas";
import { execute_telegram } from "@/utils/interfaces/telegram2";
import { MESSAGE_WHITELISTED_PART1, MESSAGE_WHITELISTED_PART2 } from "@/utils/strings";
import send_voice_via_telegram_nonbot from "@/utils/send_voice_via_telegram_nonbot";

async function execute(body: any) {
    const reference = body.reference;
    await execute_mongo_put(COLLECTION.WHITELIST, { reference }, { is_whitelisted: true });

    const salesbot_id = new ObjectId(body.salesbot_id);
    const db = await get_db();
    const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: salesbot_id }) as SalesBot;

    await execute_telegram(salesbot.settings.telegram2_phone_number, salesbot.settings.telegram2_auth_code, async (telegram: Telegram) => {
        await telegram.send_text(MESSAGE_WHITELISTED_PART1, reference);
        await send_voice_via_telegram_nonbot({
            platform_chat_id: reference,
            messenger: telegram,
            voice_id: salesbot.settings.voice_id,
            voice_platform: salesbot.settings.voice_platform,
            voice_platform_api_key: salesbot.settings.elevenlabs_api_key,
            text: MESSAGE_WHITELISTED_PART2,
            voice_speed: parseFloat(salesbot.settings.voice_speed)
        })
        await new Promise(resolve => setTimeout(resolve, 2000));
    })
}

export default wrap_api_function(execute);