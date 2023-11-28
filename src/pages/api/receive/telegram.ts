import download_file from "@/utils/download_file";
import generate_random_filename from "@/utils/generate_random_filename";
import Telegram from "@/utils/interfaces/telegram";
import query_api from "@/utils/query_api";
import { COLLECTION } from "@/utils/query_api_method";
import wrap_api_function from "@/utils/wrap_api_function";
import { Chat, Reply, SalesBot } from "../[collection]/schemas";
import upload_file from "@/utils/upload_file";
import { get_db } from "@/utils/mongo";
import { ObjectId } from "mongodb";
import { convert_mp3_to } from "salesbot_audio";
import get_or_post from "@/utils/get_or_post";
import query_chatbot from "@/utils/query_chatbot";
import send_voice_via_telegram_nonbot from "@/utils/send_voice_via_telegram_nonbot";

const DEFAULT_SALESBOT = process.env.DEFAULT_SALESBOT!;

async function fetch_telegram_file_path(telegram_api_key: string, file_id: string) {
    const url = `https://api.telegram.org/bot${telegram_api_key}/getFile?file_id=${file_id}`;
    const response = await fetch(url);
    const json = await response.json();
    return json.result.file_path;
}

async function download_telegram_file(telegram_api_key: string, telegram_file_id: string) {
    const telegram_file_path = await fetch_telegram_file_path(telegram_api_key, telegram_file_id);
    const telegram_file_url = `https://api.telegram.org/file/bot${telegram_api_key}/${telegram_file_path}`;
    const extension = telegram_file_path.split(".").slice(-1);
    const path = "./public/" + generate_random_filename(extension);
    await download_file(telegram_file_url, path);
    return path;
}

async function transcribe_telegram_audio(telegram_api_key: string, telegram_file_id: string) {
    const path = await download_telegram_file(telegram_api_key, telegram_file_id);
    const transcribed = await query_api("audio/speech2text", { path });
    return transcribed;
}

async function execute(body: any) {
    const telegram_chat_id = body.message.chat.id;
    const salesbot = await get_salesbot(DEFAULT_SALESBOT);
    const telegram: Telegram = new Telegram(salesbot.settings.telegram_api_key);
    const text = body.message.text
        ? body.message.text
        : await transcribe_telegram_audio(salesbot.settings.telegram_api_key, (body.message.voice).file_id);
    const text_response = await ask_bot(text, DEFAULT_SALESBOT, telegram_chat_id);

    const send_as_voice = Math.random() < parseFloat(salesbot.settings.send_as_voice_probability);
    if (send_as_voice) {
        await send_voice_via_telegram_nonbot({
            platform_chat_id: telegram_chat_id + "",
            messenger: telegram,
            voice_id: salesbot.settings.voice_id,
            voice_platform: salesbot.settings.voice_platform,
            voice_platform_api_key: salesbot.settings.elevenlabs_api_key,
            text: text_response,
            voice_speed: parseFloat(salesbot.settings.voice_speed)
        })
        // const voice_id = salesbot.settings.voice_id;
        // const path_to_audio = await convert_text_to_speech(text_response, voice_id, salesbot.settings.voice_platform);
        // const path_oga = await convert_mp3_to(path_to_audio, "ogg");
        // const audio_url = await upload_file(path_oga);
        // await telegram.send_audio(audio_url, telegram_chat_id);
    } else {
        await telegram.send_text(text_response, telegram_chat_id);
    }
}

async function ask_bot(text: string, salesbot: string, telegram_chat_id: number) {
    const chat = await get_or_post(COLLECTION.CHAT, { salesbot, identifier: telegram_chat_id + "" }, { salesbot, identifier: telegram_chat_id + "", memory: {} }) as unknown as Chat;
    const chat_id = chat._id.toString();
    const db = await get_db();
    const replies: Reply[] = await db.collection(COLLECTION.REPLY).find({ chat: chat_id }).toArray();
    const replies_sorted = replies.sort((a, b) => b.created - a.created);
    const last_10_replies = replies_sorted.length > 5 ? replies_sorted.slice(replies_sorted.length - 5) : replies_sorted;
    const previous_messages = last_10_replies.map(({ request, response }) => ([{ text: request, is_self: true }, { text: response, is_self: false }]))
        .flat();
    const messages = [
        ...previous_messages,
        { text, is_self: true }
    ]
    const response = await query_chatbot(messages, chat_id)
        .then(response => response.replaceAll(new RegExp(/According to ID [0-9a-f]+/, "g"), ""))

    await db.collection(COLLECTION.REPLY).insertOne({
        telegram_chat_id,
        chat: chat_id,
        request: text,
        response,
        messages: messages.map(({ is_self, text }) => (is_self ? "User: " : "Bot: ") + text).join("\n")
    });

    return response;
}


async function get_salesbot(salesbot_id: string) {
    const db = await get_db();
    return await db.collection(COLLECTION.SALESBOT).findOne({ _id: new ObjectId(salesbot_id) }) as SalesBot;
}

export default wrap_api_function(execute);