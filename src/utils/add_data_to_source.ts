import { COLLECTION, mongo_post } from "./query_api_method";

export default async function add_data_to_source(salesbot_id: string, content: string, source: string, directory: string) {
    return await mongo_post(COLLECTION.TEXT, [
        {
            content,
            name: source,
            directory,
            is_original: true,
            rewrites: 0,
            is_q_and_a: false
        }
    ])
}
