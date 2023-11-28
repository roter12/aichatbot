import { NextApiRequest, NextApiResponse } from 'next';
import { query_open_ai, stream_open_ai } from '@/utils/query_open_ai';
import { Readable } from 'stream';
import { ObjectId } from 'mongodb';
import nextjsCors from 'nextjs-cors'
import moment from 'moment';
import { get_db } from './mongo';
import { Chat, SalesBot } from '@/pages/api/[collection]/schemas';
import { COLLECTION } from './query_api_method';
import { execute_mongo_get } from '@/pages/api/[collection]';

type OwnMessage = { text: string, is_self: boolean, created: number };

function format_time(unix: number) {
    return moment(unix).format("HH:mm");
}

async function execute(generate_prompt: (chat_id: ObjectId, messages: OwnMessage[]) => Promise<string>, receive_word: (word: string) => void, body: any, req: NextApiRequest, res: NextApiResponse) {
    const messages = body.messages as OwnMessage[];

    const messages_formatted = messages.map(({ text, is_self, created }: OwnMessage) => ({
        role: is_self ? 'user' : 'assistant',
        content: text || ''
    }));

    let prompt;

    try {
        prompt = await generate_prompt(new ObjectId(body.chat_id), messages);
    } catch (thrown) {
        if (typeof thrown === "string") {
            receive_word(thrown);
            receive_word('[--DONE--]');
            return;
        } else {
            throw thrown;
        }
    }

    const salesbot = await get_salesbot_from_chat_id(new ObjectId(body.chat_id));
    const model = salesbot.settings.chatgpt_model || "gpt-3.5-turbo-16k";


    const messages_with_context = [
        ...messages_formatted,
        { role: 'system', content: prompt },
    ] as { role: 'user' | 'assistant' | 'system', content: string }[];

    return await stream_open_ai(receive_word, messages_with_context, model, salesbot.settings.openai_key);
}

async function get_salesbot_from_chat_id(chat_id: ObjectId) {
    const db = await get_db();
    const chat = await db.collection(COLLECTION.CHAT).findOne({ _id: chat_id }) as Chat;
    const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: chat!.salesbot }) as SalesBot;
    return salesbot;
}

async function buffer(readable: Readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default function wrap_openai_stream(
    generate_prompt: (chat_id: ObjectId, messages: OwnMessage[]) => Promise<string>,
    on_completion: (chat_id: ObjectId, messages: OwnMessage[], response: string) => Promise<void>
) {
    return async function handler(req: NextApiRequest, res: NextApiResponse) {

        await nextjsCors(req, res, {
            // Options
            methods: ['GET', 'POST'],
            origin: '*', //Or the origins you want to allow
            optionsSuccessStatus: 200,
        });

        const buf = await buffer(req);
        const rawBody = buf.toString('utf8');
        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch (error) {
            console.log(rawBody);
            console.log(error);
            throw error;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        let response = "";

        async function end() {
            await on_completion(new ObjectId(body.chat_id), body.messages, response);
            res.end();
        }

        await execute(
            generate_prompt,
            async (value: string) => {
                if (value === '[--DONE--]') {
                    await end();
                } else if (value === '[--REDO--]') {
                    await end();
                } else {
                    response += value;
                    res.write(value);
                    (res as any).flush();
                }
            },
            body,
            req,
            res
        ).catch(async (error: Error) => {
            const error_message = " /// ERROR: " + error.message;
            response += error_message;
            res.write(error_message);
            await end();
        });

        req.on('close', async () => {
            await end();
        });

        req.on('abort', async () => {
            await end();
        });

        req.on('end', async () => {
            await end();
        });
    }
}

export const config = {
    api: {
        bodyParser: false
    }
};