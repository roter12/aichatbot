import { Configuration, OpenAIApi } from 'openai';
import { Readable } from 'stream';

// const API_KEY = process.env.OPENAI_KEY as string;

// const configuration = new Configuration({
//     apiKey: API_KEY
// });
// const openai = new OpenAIApi(configuration);

type Message = {
    role: 'user' | 'system' | 'assistant';
    content: string;
};

export async function query_open_ai(messages: Message[], model: "gpt-3.5-turbo-16k" | "gpt-4" | "gpt-4-vision-preview" | "gpt-4-1106-preview", api_key: string, max_tokens = 2048) {
    //return stream_open_ai(receive_word);

    const url = 'https://api.openai.com/v1/chat/completions';

    const body = {
        max_tokens,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE!) || 0.5,
        model,
        messages
    } as any;

    let response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${api_key}`,
        },
        body: JSON.stringify(body),
    })
        .then((response: any) => response.json())
        .then((x: any) => {
            if (!x.choices) {
                console.log(x)
                throw new Error("Invalid response from OpenAI")
            }
            // console.log(x.choices[0])
            return x;
        })
        .then((json: any) => ({
            response: json.choices[0].message.content,
            tokens: json.usage.total_tokens
        }))
        .catch((error: any) => {
            console.error(error);
            return {
                response: "Sorry, something went wrong.",
                tokens: 0
            }
        });

    return response.response;
}

export async function stream_open_ai(receive_word: (word: string) => void, messages: Message[], model: "gpt-4" | "gpt-3.5-turbo-16k", api_key: string) {

    const result = await query_open_ai(messages, model, api_key, 1024);
    receive_word(result);
    receive_word("[--DONE--]");
    return;

    // const res = (await openai.createChatCompletion(
    //     {
    //         model: 'gpt-3.5-turbo',
    //         messages,
    //         max_tokens: 2048,
    //         temperature: parseFloat(process.env.OPENAI_TEMPERATURE!) || 0.5,
    //         stream: true
    //     },
    //     { responseType: 'stream' }
    // )) as any;

    // res.data.on('data', (data: any) => {
    //     const lines = data
    //         .toString()
    //         .split('\n')
    //         .filter((line: string) => line.trim() !== '');
    //     for (const line of lines) {
    //         const message = line.replace(/^data: /, '');
    //         if (message === '[DONE]') {
    //             return;
    //         }
    //         try {
    //             const parsed = JSON.parse(message);
    //             const delta = parsed.choices[0].delta.content;
    //             if (delta) {
    //                 receive_word(delta);
    //             }
    //         } catch (error) {
    //             console.error('Could not JSON parse stream message', message, error);
    //         }
    //     }
    // });

    // res.data.on('error', (err: any) => {
    //     console.error('Stream error', err);
    //     receive_word('(There was an error)');
    //     receive_word('[--REDO--]');
    // });

    // res.data.on('end', () => {
    //     receive_word('[--DONE--]');
    // });

    // return await readableToString2(res.data);
}

async function readableToString2(readable: Readable) {
    let result = '';
    for await (const chunk of readable) {
        const json_strings = chunk
            .toString()
            .replace('data: ', '')
            .split('\ndata: ')
            .filter((s: string) => s !== '[DONE]\n\n');
        for (const json_string of json_strings) {
            const json = JSON.parse(json_string);
            const delta = json.choices[0].delta.content;
            if (delta !== undefined) {
                result += delta;
            }
        }
    }
    return result;
}