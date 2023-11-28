import { ObjectId } from 'mongodb';
import wrap_openai_stream from '../../../utils/wrap_openai_stream';
import { get_db } from '@/utils/mongo';
import { COLLECTION } from '@/utils/query_api_method';
import { SalesBot } from '../[collection]/schemas';


async function generate_prompt(chat_id: ObjectId, messages: { text: string, is_self: boolean }[]) {
    const db = await get_db();
    const chat = await db.collection(COLLECTION.CHAT).findOne({ _id: chat_id });
    const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: chat!.salesbot }) as SalesBot;
    return salesbot.simulator_prompt + " Keep your response short, to 30 words or less.";
}

export default wrap_openai_stream(generate_prompt, async () => { })

export const config = {
    api: {
        bodyParser: false
    }
};