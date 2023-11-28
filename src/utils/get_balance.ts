import { get_latest_balance_snapshot, query_total_amount_deposited_since, query_total_duration_for_chat_since } from "./balances";

export default async function get_balance(telegram_chat_id: string, chat_id: string) {
    const CENTS_PER_MINUTE = 100;
    const { total_amount_deposited, latest_balance_snapshot_timestamp } = await query_total_amount_deposited(telegram_chat_id)
    // const total_replies_for_chat = await query_total_messages_for_chat_since(chat_id, latest_balance_snapshot_timestamp || 0);
    const total_duration = await query_total_duration_for_chat_since(chat_id, latest_balance_snapshot_timestamp || 0);
    const total_amount_spent = total_duration * CENTS_PER_MINUTE / 60;
    return total_amount_deposited - total_amount_spent + 50;
}

async function query_total_amount_deposited(telegram_chat_id: string) {
    const latest_balance_snapshot = await get_latest_balance_snapshot(telegram_chat_id);
    const total_amount_deposited = await query_total_amount_deposited_since(telegram_chat_id, latest_balance_snapshot?.created || 0) +
        (latest_balance_snapshot?.balance || 0);
    return ({
        total_amount_deposited,
        latest_balance_snapshot_timestamp: latest_balance_snapshot?.created
    })
}