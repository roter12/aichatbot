import { execute_mongo_get, execute_mongo_post } from "@/pages/api/[collection]";
import { COLLECTION } from "./query_api_method";
import { ObjectId } from "mongodb";
import { get_db } from "./mongo";
import { SalesBot } from "@/pages/api/[collection]/schemas";
import { execute_telegram } from "./interfaces/telegram2";

export default async function new_bot({
    _id_of_salesbot_to_copy,
    telegram_api_key,
    bot_name,
    response_prompt,
    gmail
}: {
    _id_of_salesbot_to_copy: string,
    telegram_api_key: string,
    bot_name: string,
    response_prompt: string,
    gmail: string,
}) {

    const db = await get_db();

    const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: new ObjectId(_id_of_salesbot_to_copy) }) as SalesBot;

    const [_id] = await execute_mongo_post(COLLECTION.SALESBOT, [{
        name: bot_name+"",
        settings: {
            ...salesbot.settings,
            name: bot_name,
            telegram_api_key,
            send_as_voice_probability: 0
        },
        post_process: "return text",
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        response_prompt,
    }]);
    await execute_mongo_post(COLLECTION.BOT_ACCESS, [{
        salesbot: _id,
        email: "themicrohash@gmail.com"
    }, {
        salesbot: _id,
        email: gmail
    }]);
    await execute_mongo_post(COLLECTION.STATE, [{
        salesbot: _id,
        label: "New State",
        prompt: "",
        storage: ""
    }])
    const username = await create_new_telegram_bot(bot_name);
    return username;
}


async function sleep(seconds: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    })
}

function random_characters(length: number) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
}

const BOT_FATHER_CHAT_ID = 93372553;
const _ID_OF_MOTHER_BOT = "64cf2c9834e8167515cfd3e5";

async function create_new_telegram_bot(bot_name: string) {
    const nonce = "_" + random_characters(3)
    const username = bot_name.toLowerCase().replaceAll(" ", "_") + nonce + "_bot";
    const salesbot = await execute_mongo_get(COLLECTION.SALESBOT, { _id: _ID_OF_MOTHER_BOT }, false) as SalesBot;

    await execute_telegram(salesbot.settings.telegram2_phone_number, salesbot.settings.telegram2_auth_code, async (telegram) => {
        await telegram.send_text("/newbot", BOT_FATHER_CHAT_ID);
        await sleep(3);
        await telegram.send_text(bot_name, BOT_FATHER_CHAT_ID);
        await sleep(2);
        await telegram.send_text(username, BOT_FATHER_CHAT_ID);
        await sleep(2);
    })

    return username;
}