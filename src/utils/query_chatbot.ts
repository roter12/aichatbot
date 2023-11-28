import query_api from "./query_api";

export default async function query_chatbot(messages: { text: string, is_self: boolean }[], chat_id: string, image_url?: string) {
    // const response = await fetch(process.env.NEXT_PUBLIC_API_PATH + 'chat/respond', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         messages,
    //         chat_id
    //     })
    // });

    // if (!response.ok) {
    //     throw new Error(`An error occurred: ${response.statusText}`);
    // }

    // const stream = response.body;
    // const reader = stream!.getReader();

    // async function readStream(current_message: string): Promise<string> {
    //     const { value, done } = await reader.read();

    //     if (done) {
    //         const complete_message = current_message;
    //         const words = complete_message.split(" ").length;
    //         await new Promise(resolve => setTimeout(resolve, 0));
    //         return complete_message;
    //     }

    //     const new_text = new TextDecoder().decode(value);
    //     return await readStream(current_message + new_text) as string;
    // }
    // const result = await readStream('');

    const result = await query_api('chat/respond', {
        messages,
        chat_id,
        image_url
    })


    const FORBIDDEN_WORDS = [
        "ai language model",
        "virtual assistant",
        "ai assistant",
        "/// error",
        "as an ai",
        "sorry, something went wrong"
    ];
    if (FORBIDDEN_WORDS.some(word => result.toLowerCase().includes(word))) {

        if (chat_id === "64cf39f6ba4b0ec2391d8cf1") {
            return result + " (Forbidden word detected)";
        }

        console.log("Forbidden word detected: " + result);
        return "Hmm..."
    }
    return result;
}