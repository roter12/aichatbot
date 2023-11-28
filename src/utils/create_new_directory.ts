import { COLLECTION, mongo_post } from "./query_api_method";

export default async function create_new_directory(salesbot_id: string, name: string, method: string) {
    return await mongo_post(COLLECTION.DIRECTORY, [
        {
            salesbot: salesbot_id,
            name,
            method
        }
    ]).then(async (result) => {
        return result[0];
    });
}