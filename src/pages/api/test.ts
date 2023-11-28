import query_api from "@/utils/query_api";
import wrap_api_function from "@/utils/wrap_api_function";
import { NextApiRequest } from "next";
import { execute_mongo_post } from "./[collection]";
import { COLLECTION } from "@/utils/query_api_method";
import { query_open_ai } from "@/utils/query_open_ai";


async function execute(body: any, req: NextApiRequest) {
    return await query_open_ai([{
        role: "user",
        "content": [
            {"type": "text", "text": "What do you see in this image:"},
            {
                "type": "image_url",
                "image_url": "https://docbot.qame.org//1699332777059xnz0hmnoxgqgnba88j.jpg",
            },
        ],
    } as any], "gpt-4-vision-preview", "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")
}

export default wrap_api_function(execute);