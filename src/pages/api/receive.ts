import wrap_api_function from "@/utils/wrap_api_function";
import query_api from "@/utils/query_api";
import { COLLECTION } from "@/utils/query_api_method";

import { Chat, Message, Payment, Reply, SalesBot, Whitelist } from "./[collection]/schemas";
import * as mm from 'music-metadata';
import { get_db } from "@/utils/mongo";
import { ObjectId } from "mongodb";
import Telegram, { execute_telegram } from "@/utils/interfaces/telegram2";
import get_or_post from "@/utils/get_or_post";
import { execute_mongo_delete, execute_mongo_get, execute_mongo_post, execute_mongo_put } from "./[collection]";
import moment from "moment";
import query_chatbot from "@/utils/query_chatbot";
import generate_stripe_checkout_link from "@/utils/generate_stripe_checkout_link";
import { MESSAGE_DEPOSIT } from "@/utils/strings";
import get_balance from "@/utils/get_balance";
import log from "@/utils/log";
import new_bot from "@/utils/new_bot";
import { query_open_ai } from "@/utils/query_open_ai";

const { ENABLE_PAYMENT: ENABLE_PAYMENT_STRING } = process.env;
const ENABLE_PAYMENT = ENABLE_PAYMENT_STRING == "true";
const BOT_FATHER_USER_ID = "93372553";
const IS_WHITELIST_ENABLED = process.env.IS_WHITELIST_ENABLED === "true";

var db: any;

async function message_to_text(content: any) {

    return content.text?.formattedText?.text || content?.text?.text || content.emoji
}

async function send_text_with_delay(delay: number, text: string, telegram_chat_id: string, telegram2_phone_number: string, telegram2_auth_code: string) {

    setTimeout(async () => {
        await execute_telegram(telegram2_phone_number, telegram2_auth_code, async (telegram: Telegram) => {
            const chat = await telegram.get_chat(telegram_chat_id);
            const user = await telegram.get_user(telegram_chat_id);
            // console.log(chat);
            // await telegram.get_user(chat.user_id);
            await telegram.send_text(text, telegram_chat_id);
            await new Promise(resolve => setTimeout(resolve, 2000));
        });
    }, delay);
}

async function execute(body: any) {

    console.log(body);

    db = db || await get_db();

    const salesbot_id = body.salesbot_id as string;
    const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: new ObjectId(salesbot_id) }) as SalesBot;
    const { telegram2_phone_number, telegram2_auth_code } = salesbot.settings;

    const telegram_chat_id = body.message.chat_id;
    const chat_id = await get_chat_id(salesbot_id, telegram_chat_id + "");

    if (body.message.content._ === "messageVoiceNote") {
        await execute_telegram(telegram2_phone_number, telegram2_auth_code, async (telegram: Telegram) => {
            await telegram.download_voice_message(body.message);
        });
        return;
    }

    const text = await message_to_text(body.message.content) || "";

    await execute_mongo_post(COLLECTION.MESSAGE, [{
        chat: new ObjectId(chat_id),
        text,
        is_bot: false
    }]);

    if (body.message.is_outgoing) {
        if (text === "Hey babe 😘") {
            await execute_mongo_delete(COLLECTION.MESSAGE, { chat: new ObjectId(chat_id), is_bot: true }, true);
        } else {
            return;
        }
    }

    if (salesbot_id === "64cf2c9834e8167515cfd3e5") {

        if (text.includes("Use this token to access the HTTP API:")) {
            const token = text.split("Use this token to access the HTTP API:\n")[1].split("\n")[0].trim();
            const [salesbot] = await execute_mongo_get(COLLECTION.SALESBOT, {}, true, 1, { created: -1 }) as SalesBot[];
            await execute_mongo_put(COLLECTION.SALESBOT, { _id: salesbot._id }, { "settings.telegram_api_key": token });
            await fetch("http://dashboard.chatvip.app:3009/loadbot?_id=" + salesbot._id);
            return;
        }

        return
    }

    log("message from " + telegram_chat_id + ": " + text)

    async function send_text_and_destroy(text: string, delay = 0) {
        await send_text_with_delay(delay, text, telegram_chat_id, telegram2_phone_number, telegram2_auth_code);
    }

    async function send_video(video_url: string) {
        await execute_telegram(telegram2_phone_number, telegram2_auth_code, async (telegram: Telegram) => {
            await telegram.send_video(video_url, telegram_chat_id);
            await new Promise(resolve => setTimeout(resolve, 2000));
        });
    }

    const is_call = body.message.content._ === "messageCall";
    const stop_processing = await preprocess({ chat_id, telegram_chat_id, salesbot, text, send: send_text_and_destroy, send_video, is_call });

    if (!stop_processing) {

        const delay_exponent_min = parseFloat(salesbot.settings.delay_exponent_min || "1");
        const delay_exponent_max = parseFloat(salesbot.settings.delay_exponent_max || "2");
        let delay = Math.pow(10, random_number(delay_exponent_min, delay_exponent_max)) * 1000;

        await execute_mongo_delete(COLLECTION.SCHEDULED_REPLIES, { telegram_chat_id }, true);
        await execute_mongo_post(COLLECTION.SCHEDULED_REPLIES, [{
            text,
            response: "",
            telegram_chat_id,
            time: moment().unix()
        }]) as string[];

        setTimeout(async () => {
            await reply({ send: send_text_and_destroy, chat_id, telegram_chat_id, salesbot, text });
        }, delay);
    }
}

function split_into_sentences(text: string) {
    return text.split(/(?<=[.?!])\s+(?=[a-zA-Z])/g);
}

function concat_strings_until_length_exceeded(strings: string[], max_length: number) {
    let result = "";
    for (const string of strings) {
        result += string;
        if (result.length > max_length) {
            break;
        }
    }
    return result;
}

async function reply({ send, chat_id, telegram_chat_id, salesbot, text }: {
    send: (text: string) => Promise<any>, chat_id: string, telegram_chat_id: string, salesbot: SalesBot, text: string
}) {
    const chat = await db.collection(COLLECTION.CHAT).findOne({ _id: new ObjectId(chat_id) }) as Chat;
    const is_chat_young = chat.created >= moment().subtract(5, "minute").unix();

    const messages = await query_message_history(chat_id);
    let response = await query_chatbot(messages, chat_id);
    let salesbot_copy = { ...salesbot };

    if (is_chat_young) {
        salesbot_copy.settings.delay_exponent_min = "0.84";
        salesbot_copy.settings.delay_exponent_max = "1.17";
        response = concat_strings_until_length_exceeded(split_into_sentences(response), 50);
    }

    await submit_response({
        send,
        text,
        response,
        chat_id,
        telegram_chat_id,
        salesbot: salesbot_copy,
        messages
    })
}



async function preprocess({ is_call, chat_id, telegram_chat_id, salesbot, text, send, send_video }
    : { is_call: boolean, chat_id: string, telegram_chat_id: string, salesbot: SalesBot, text: string, send_video: (url: string) => Promise<any>, send: (text: string) => Promise<any> }) {
    if (await is_chat_new(chat_id)) {
        setTimeout(async () => {
            await send_first_messages({ salesbot, chat_id, send, send_video, telegram_chat_id });
        }, 5000);
        return true;
    }

    const any_commands_executed = await execute_commands(text, send, chat_id, telegram_chat_id);
    if (any_commands_executed) {
        return true;
    }

    if (IS_WHITELIST_ENABLED) {
        const whitelist_entry = await execute_mongo_get(COLLECTION.WHITELIST, { reference: telegram_chat_id + "" }, false) as Whitelist;
        if (!whitelist_entry) {
            const MESSAGE_WAITLIST = "Go to https://anastasia.qame.org/checkout?r=" + telegram_chat_id + " to start chatting with me anytime and anywhere 😏💦"
            await send(MESSAGE_WAITLIST);
            return true;
        } else if (!whitelist_entry.is_whitelisted) {
            const MESSAGE_WAITLIST = "You are currently on the waitlist. I will let you know when you can start chatting with me 😏💦"
            await send(MESSAGE_WAITLIST);
            return true;
        }
    }

    const is_allowed_to_chat = await enforce_paywall(telegram_chat_id, chat_id);
    if (!is_allowed_to_chat) {
        const name = await get_name(telegram_chat_id, salesbot.settings.telegram2_phone_number, salesbot.settings.telegram2_auth_code)
        const payments = await execute_mongo_get(COLLECTION.PAYMENT, { reference: telegram_chat_id + "", is_paid: true }, true) as Payment[];
        const is_new_customer = payments.length == 0;
        const deposit_url = generate_stripe_checkout_link("telegram", telegram_chat_id, "deposit");
        const MESSAGE_EXISTING_CUSTOMER = `Hey babe 💕 to keep chatting with me, simply deposit more credits here:\n\n${deposit_url}\n\n I'm waiting to hear back from you, ${name} 💋`;
        const MESSAGE_NEW_CUSTOMER = `Hey babe to speak to me more just add credits to your account to unlock our private conversation 💋 \n\n${deposit_url}\n\nLet me know when you’re ready to speak to me, ${name}! 😘`;
        const response = is_new_customer ? MESSAGE_NEW_CUSTOMER : MESSAGE_EXISTING_CUSTOMER;

        const existing_messages = await execute_mongo_get(COLLECTION.MESSAGE, {
            chat: new ObjectId(chat_id),
            text: { $in: [MESSAGE_NEW_CUSTOMER, MESSAGE_EXISTING_CUSTOMER] },
            created: { $gte: moment().unix() - 1800 }
        }, true) as Message[];

        if (existing_messages.length == 0) {
            // await send(response);
        }

        return true;
    }

    if (is_call) {
        const MESSAGE = "Hey babe I'm unable to answer calls here but let's keep the conversation going and have some naughty fun, what do you say? 😈";
        setTimeout(async () => {
            await send(MESSAGE);
        }, 10000);
        return true;
    }

    return false;
}

async function enforce_paywall(telegram_chat_id: string, chat_id: string) {
    const balance = await get_balance(telegram_chat_id, chat_id);
    console.log("Balance: ", balance);
    return balance > 0 || !ENABLE_PAYMENT;
}

async function execute_commands(text: string, send: (text: string) => Promise<any>, chat_id: string, telegram_chat_id: string) {
    if (text === "/clear") {
        execute_mongo_delete(COLLECTION.CHAT, { _id: new ObjectId(chat_id) });
        await send("Conversation cleared")
        return true;
    }

    if (text === "/vip") {
        const deposit_url = generate_stripe_checkout_link("telegram", telegram_chat_id, "subscription");
        const MESSAGE_NEW = `Hello my naughty boy, you will find the hottest content here 😈🍒 To start receiving pictures of me and other exclusive content just subscribe below 👇😘\n\n${deposit_url}`;
        const MESSAGE_SUBSCRIBED = "Thanks for subscribing! 💕 Welcome to the world of big boobs 😏 I can’t wait to show you what I have in store for you 😉 Join me in this channel to see new content everyday 👉 @anastasiadollvipbot"
        const message = await is_already_subscribed(telegram_chat_id) ? MESSAGE_SUBSCRIBED : MESSAGE_NEW;
        await send(message);
        return true;
    }

    if (text === "/deposit") {
        const deposit_url = generate_stripe_checkout_link("telegram", telegram_chat_id, "deposit");
        const balance = Math.max(await get_balance(telegram_chat_id, chat_id), 0);
        await send(`${deposit_url}\n\n${MESSAGE_DEPOSIT}\n\nYour current balance: $${(balance / 100).toFixed(2)}`);
        return true;
    }

    if (text === "/balance") {
        const balance = Math.max(await get_balance(telegram_chat_id, chat_id), 0);
        await send(`Your current balance: £${(balance / 100).toFixed(2)}`);
        return true;
    }

    if (text.startsWith("/")) {
        return true;
    }

    return false;
}

async function is_already_subscribed(telegram_chat_id: string) {
    const documents = await execute_mongo_get(COLLECTION.PAYMENT,
        {
            reference: telegram_chat_id + "",
            is_paid: true,
            stripe_price_id: process.env.STRIPE_SUBSCRIPTION_PRICE_ID
        }, true) as Payment[];
    return documents!.length > 0;
}

async function query_message_history(chat_id: string) {
    const message_documents = await db.collection(COLLECTION.MESSAGE).find({ chat: new ObjectId(chat_id) }).sort({ created: -1 }).limit(10).toArray() as Message[];
    const messages = [
        ...message_documents.reverse().map(({ text, is_bot }) => ({ text, is_self: !is_bot }))
    ]
    return messages;
}

async function is_chat_new(chat_id: string) {
    const count = await db.collection(COLLECTION.MESSAGE).countDocuments({ chat: new ObjectId(chat_id), is_bot: true, text: { $ne: "Conversation cleared" } });
    return count == 0;
}

async function send_first_messages({ salesbot, chat_id, send_video, send, telegram_chat_id }
    : { salesbot: SalesBot, chat_id: string, send_video: (url: string) => Promise<any>, send: (text: string) => Promise<any>, telegram_chat_id: string }) {
    const first_messages = salesbot.settings.first_messages.filter(({ is_bot }) => is_bot).map(({ text }) => ({ text, is_self: false }));
    for (const { text } of first_messages) {
        const text_replaced = text.replace("{telegram_chat_id}", telegram_chat_id);
        await send(text_replaced);
        await execute_mongo_post(COLLECTION.MESSAGE, [{
            chat: new ObjectId(chat_id),
            text: text_replaced,
            is_bot: true
        }]);
    }

    if (salesbot.settings.name === "Anastasia Doll 💋") {
        await send_video("https://thehood.sfo3.cdn.digitaloceanspaces.com/video5415773942860230995.mp4");
    }
}

async function submit_response({ text, response, send, chat_id, telegram_chat_id, salesbot, messages }
    : { send: (text: string) => Promise<any>, messages: { is_self: boolean, text: string }[], text: string, response: string, chat_id: string, telegram_chat_id: string, salesbot: SalesBot }) {

    const response_audio_duration = 0;
    // random_number(parseInt(salesbot.settings.delay_average || "0") * 1000, parseInt(salesbot.settings.delay_variance || "0") * 1000);


    const scheduled_reply = await execute_mongo_get(COLLECTION.SCHEDULED_REPLIES, { telegram_chat_id }, false) as Reply;
    const scheduled_reply_id = scheduled_reply?._id;
    const time = moment().unix()
    await execute_mongo_put(COLLECTION.SCHEDULED_REPLIES, { _id: scheduled_reply_id }, { text, response, time });

    if (salesbot.settings.preview_replies !== "true") {
        query_api("send_telegram", {
            salesbot_id: salesbot._id,
            scheduled_reply_id
        });
    }

    await execute_mongo_post(COLLECTION.REPLY, [{
        telegram_chat_id,
        duration: response_audio_duration,
        chat: chat_id,
        request: text,
        response,
        message_id: "0",
        messages: messages.map(({ is_self, text }) => (is_self ? "User: " : "Bot: ") + text).join("\n")
    }]);
}

async function get_name(telegram_chat_id: string, telegram2_phone_number: string, telegram2_auth_code: string) {
    const telegram = new Telegram();
    await telegram.init({
        phone_number: telegram2_phone_number,
        auth_code: telegram2_auth_code
    });
    const name = await telegram.get_name(telegram_chat_id);
    await telegram.destroy();
    return name;
}

function random_number(from: number, to: number) {
    return from + Math.random() * (to - from);
}

async function get_voice_id(salesbot_id: string) {
    const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: new ObjectId(salesbot_id) }) as SalesBot;
    return salesbot.voice_id;
}

async function get_chat_id(salesbot_id: string, identifier: string) {
    const salesbot = new ObjectId(salesbot_id);
    if (!salesbot) {
        throw new Error("Invalid salesbot name");
    }
    const chat = await get_or_post(COLLECTION.CHAT, { salesbot, identifier }, { salesbot, identifier, memory: {} }) as unknown as Chat;
    return chat._id.toString();
}

async function get_length_of_audio_file(path: string) {
    return mm.parseFile(path)
        .then(metadata => metadata.format.duration);
}

export default wrap_api_function(execute);