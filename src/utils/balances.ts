import { ObjectId } from "mongodb";
import { get_db } from "./mongo";
import { COLLECTION } from "./query_api_method";

export async function get_latest_balance_snapshot(telegram_chat_id: number | string) {
    const db = await get_db();
    return await db.collection("balance_snapshot").aggregate([
        {
            $match: {
                reference: telegram_chat_id + ""
            }
        },
        {
            $sort: {
                created: -1
            }
        },
        {
            $limit: 1
        }])
        .toArray()
        .then((array: any[]) => {
            return array.length > 0
                ? array[0]
                : null;
        })
}

export async function query_total_amount_deposited_since(telegram_chat_id: number | string, since: number) {
    const db = await get_db();
    const total_amount = await db.collection("payment").aggregate([
        {
            $match: {
                reference: telegram_chat_id + "",
                created: { $gt: since },
                is_paid: true
            }
        },
        {
            $group: {
                _id: null,
                total_amount: { $sum: "$amount" }
            }
        }])
        .toArray()
        .then((array: any[]) => {
            if (array.length == 0) {
                return 0;
            }
            return array[0].total_amount;
        })
    return total_amount;
}

export async function query_total_replies_for_chat_since(telegram_chat_id: number | string, since: number) {
    const db = await get_db();
    return await db.collection("reply").aggregate([
        {
            $match: {
                telegram_chat_id,
                created: { $gt: since }
            }
        },
        {
            $group: {
                _id: null,
                count_replies: { $sum: 1 }
            }
        }])
        .toArray()
        .then((array: any[]) => {
            if (array.length == 0) {
                return 0;
            }
            return array[0].count_replies;
        })
}

export async function query_total_messages_for_chat_since(chat_id: string, since: number) {
    const db = await get_db();
    return await db.collection(COLLECTION.MESSAGE).aggregate([
        {
            $match: {
                chat: new ObjectId(chat_id),
                created: { $gt: since },
                is_bot: true
            }
        },
        {
            $group: {
                _id: null,
                count_replies: { $sum: 1 }
            }
        }])
        .toArray()
        .then((array: any[]) => {
            if (array.length == 0) {
                return 0;
            }
            return array[0].count_replies;
        })
}

export async function query_total_duration_for_chat_since(chat_id: string, since: number) {
    const db = await get_db();
    return await db.collection(COLLECTION.MESSAGE).aggregate([
        {
            $match: {
                chat: new ObjectId(chat_id),
                created: { $gt: since },
                is_bot: true
            }
        },
        {
            $group: {
                _id: null,
                total_duration: { $sum: "$duration" }
            }
        }])
        .toArray()
        .then((array: any[]) => {
            if (array.length == 0) {
                return 0;
            }
            return array[0].total_duration;
        })
}