import { get_db } from "@/utils/mongo";
import { COLLECTION } from "@/utils/query_api_method";
import { NextApiRequest, NextApiResponse } from "next";
import { Chat, MemorySnapshot, SalesBot } from "../[collection]/schemas";
import { ObjectId } from "mongodb";

async function getMemories(chatbot: string) {
    const db = await get_db();
    const memory_snapshots = await db.collection(COLLECTION.MEMORY_SNAPSHOT).find({ salesbot: new ObjectId(chatbot) }).toArray() as MemorySnapshot[];
    return memory_snapshots.map(memory_snapshot => ({
        id: memory_snapshot._id,
        memory: memory_snapshot.memory,
        chat: memory_snapshot.chat,
        salesbot: memory_snapshot.salesbot
    }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const chatbot = req.query.chatbot! as string;
    console.log(chatbot)
    const memories = await getMemories(chatbot);
    res.json(memories)
}