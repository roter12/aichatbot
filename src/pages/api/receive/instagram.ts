import download_file from "@/utils/download_file";
import generate_random_filename from "@/utils/generate_random_filename";
import Instagram from "@/utils/interfaces/instagram";
import query_api from "@/utils/query_api";
import { COLLECTION, mongo_get, mongo_get_or_post, mongo_post } from "@/utils/query_api_method";
import wrap_api_function from "@/utils/wrap_api_function";
import { Chat, Message, Reply, SalesBot } from "../[collection]/schemas";
import upload_file from "@/utils/upload_file";
import { get_db } from "@/utils/mongo";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import get_or_post from "@/utils/get_or_post";
import query_chatbot from "@/utils/query_chatbot";
import { get_latest_balance_snapshot, query_total_amount_deposited_since, query_total_messages_for_chat_since, query_total_replies_for_chat_since } from "@/utils/balances";
import { execute_mongo_post } from "../[collection]";

const { NEXT_PUBLIC_API_PATH, DEFAULT_SALESBOT, ENABLE_PAYMENT: ENABLE_PAYMENT_STRING } = process.env;
const ENABLE_PAYMENT = ENABLE_PAYMENT_STRING == "true";

async function execute_inner(salesbot: SalesBot, text: string, user_id: string) {
    const instagram: Instagram = new Instagram(salesbot.settings.instagram_api_key!, salesbot.settings.instagram_page_id!);

    if (text === "/clear") {
        const db = await get_db();
        await db.collection("chat").deleteMany({ identifier: user_id + "", salesbot: new ObjectId(salesbot._id.toString()) });
        await instagram.send_text("Conversation cleared", user_id);
        return;
    }

    if (text === "/voice") {
        const db = await get_db();
        await db.collection(COLLECTION.SALESBOT).updateOne({ _id: new ObjectId(salesbot._id.toString()) }, { $set: { "settings.send_as_voice_probability": "1" } });
        await instagram.send_text("Voice enabled", user_id);
        return;
    }

    if (text === "/text") {
        const db = await get_db();
        await db.collection(COLLECTION.SALESBOT).updateOne({ _id: new ObjectId(salesbot._id.toString()) }, { $set: { "settings.send_as_voice_probability": "0" } });
        await instagram.send_text("Voice disabled", user_id);
        return;
    }

    if (text === "/deposit") {
        const deposit_url = NEXT_PUBLIC_API_PATH + (NEXT_PUBLIC_API_PATH?.endsWith("/") ? "" : "/") + `checkout?product=deposit&platform=instagram&reference=` + user_id;
        await instagram.send_text(`Payments are securely processed through Stripe. Please select a deposit amount. \n\n${deposit_url} \n\nPricing: Your account is billed at £1/minute of audio responses or 20 text responses. Let me know when you are ready to speak to me! 💕`, user_id);
        return;
    }

    const chat = await get_or_post(COLLECTION.CHAT, { salesbot: salesbot._id, user_id }, { salesbot: salesbot._id, user_id, memory: {} }) as unknown as Chat;
    const chat_id = chat._id.toString();

    const latest_balance_snapshot = await get_latest_balance_snapshot(user_id);
    const total_amount_deposited = await query_total_amount_deposited_since(user_id, latest_balance_snapshot?.created || 0) +
        (latest_balance_snapshot?.balance || 0);
    const replies_bought = total_amount_deposited / 30;
    const total_replies_for_chat = await query_total_messages_for_chat_since(chat_id, latest_balance_snapshot?.created || 0) / 2;
    console.log("Responses available = " + replies_bought + " - " + total_replies_for_chat)

    if (total_replies_for_chat === 0) {
        const response = `Meet Josefin AI! 💕☀️
 
Connect with me using text or voice messages🎙 and speak to me in any language 🌎
 
Type /text to receive text messages and type /voice to receive voice messages from me 😉
Add credits to your account by typing '/deposit'.
 
After hours of training, I built an extension of myself that can think and feel just like me. I am always here for you, and I am excited to speak to you!
 
Be courteous, respectful, and have fun. I’ll be looking out for my TOP subscribers of my AI to give them a shoutout or reach out to them soon! 🤩
 
By using this platform, you agree that you are aged 18+ and your participation signifies your agreement to ChatVIP’s terms and conditions.
 
For any questions or suggestions, feel free to contact our team at info@chatvip.com. Thank you!`
        await instagram.send_text(response, user_id);
        await execute_mongo_post(COLLECTION.MESSAGE, [{ chat: chat._id, text: "", is_bot: true }])
        return;
    }

    if (total_replies_for_chat >= replies_bought && ENABLE_PAYMENT) {
        const response = `Hey, to start chatting with me, simply deposit credits by typing '/deposit' and unlock our chat. I can’t wait to speak with you!`;
        await instagram.send_text(response, user_id);
        return;
    }

    const text_response = await ask_bot(chat_id, text, new ObjectId(salesbot._id.toString()), user_id);

    const send_as_voice = Math.random() < parseFloat(salesbot.settings.send_as_voice_probability);
    if (send_as_voice) {
    } else {
        await instagram.send_text(text_response, user_id);
    }
}

async function ask_bot(chat_id: string, text: string, salesbot: ObjectId, identifier: string) {
    const db = await get_db();

    await execute_mongo_post(COLLECTION.MESSAGE, [
        {
            chat: chat_id,
            text: text,
            is_bot: false
        }
    ])

    const all_messages = await db.collection(COLLECTION.MESSAGE).find({ chat: new ObjectId(chat_id) })
        .sort({ created: -1 })
        .limit(20)
        .toArray() as Message[];
    const messages = [
        ...all_messages.reverse().map(({ text, is_bot }) => ({ text, is_self: !is_bot })),
        { text, is_self: true }
    ]

    const response = await query_chatbot(messages, chat_id);

    await execute_mongo_post(COLLECTION.MESSAGE, [
        {
            chat: chat_id,
            text: response,
            is_bot: true
        }
    ])

    return response;
}

async function get_salesbot(salesbot_id: string) {
    const db = await get_db();
    return await db.collection(COLLECTION.SALESBOT).findOne({ _id: new ObjectId(salesbot_id) }) as SalesBot;
}

async function transcribe_audio(audio_url: string) {
    const local_path = "./public/" + generate_random_filename("mp4");
    await download_file(audio_url, local_path);
    return await query_api("audio/speech2text", { path: local_path })
}

export default wrap_api_function(execute);

async function execute(body: any, req: NextApiRequest, res: NextApiResponse) {

    if (body["hub.challenge"]) {
        console.log(body);
        res.write(body["hub.challenge"]);
        res.end();
        return;
    }

    const message = body.entry[0].messaging[0];
    const sender_id = message.sender.id;
    const salesbot = await get_salesbot(DEFAULT_SALESBOT!);
    if (sender_id !== salesbot.settings.instagram_user_id) {
        const text = message.message.text
            ? message.message.text
            : await transcribe_audio(message.message.attachments[0].payload.url)
        if (text) {
            return await execute_inner(salesbot, text, sender_id);
        }
    }
}


