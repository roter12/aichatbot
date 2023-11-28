import query_api from "./query_api";

export enum COLLECTION {
    ACCOUNT = "account",
    MEMORY = "memory",
    STATE = "state",
    TRANSITION = "transition",
    SALESBOT = "salesbot",
    CHAT = "chat",
    CONVERSATION = "conversation",
    DIRECTORY = "directory",
    TEXT = "text",
    CHUNK = "chunk",
    SCRAPE = "scrape",
    REPLY = "reply",
    ACTION = "action",
    RECEIVED = "received",
    PAYMENT = "payment",
    MEMORY_SNAPSHOT = "memory_snapshot",
    MESSAGE_RATING = "message_rating",
    USER = "user",
    BOT_ACCESS = "bot_access",
    SCHEDULED_REPLIES = "scheduled_reply",
    MESSAGE = "message",
    MENTAL_NOTEBOOK = "mental_notebook",
    WHITELIST = "whitelist",
    CUSTOM = "custom",
    VOICE_UPLOAD = "voice_upload",
    PAYOUT_REQUEST = "payout_request",
    CREATOR = "creator",
    CHATBOT_SETUP = "chatbot_setup",
    STRIPE_PRICE = "stripe_price",
    STRIPE_PAYMENT = "stripe_payment",
    REFERRAL = "referral",
    ERROR = "error",
}

export async function mongo_post(collection: COLLECTION, documents: any[]) {
    return await query_api(collection, { documents }, { method: "POST" })
}

export async function mongo_get(collection: COLLECTION, query: any, options?: { limit?: number, sort?: any, offset?: number, multiple: boolean }) {
    const is_called_from_frontend = typeof window !== 'undefined';
    if (is_called_from_frontend) {
        return await query_api(collection, { query, ...options }, { method: "GET" })
    } else {
        throw new Error("mongo_get should only be called from the frontend")
    }
}

export async function mongo_get_or_post(collection: COLLECTION, query: any, new_document: any) {
    const document = await mongo_get(collection, query, { multiple: false });
    if (!document) {
        const _id = await mongo_post(collection, [new_document]).then(ids => ids[0]);
        return await mongo_get(collection, { _id }, { multiple: false });
    } else {
        return document;
    }
}

export async function mongo_put(collection: COLLECTION, query: any, $set: any) {
    return await query_api(collection, { query, $set }, { method: "PUT" })
}

export async function mongo_delete(collection: COLLECTION, query: any) {
    return await query_api(collection, { query }, { method: "DELETE" })
}

export async function mongo_count(collection: COLLECTION, query: any) {
    return await query_api(collection, { query, count: true }, { method: 'GET' });
}