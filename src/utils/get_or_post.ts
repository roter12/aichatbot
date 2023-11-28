import { execute_mongo_get, execute_mongo_post } from "@/pages/api/[collection]";
import { get_db } from "./mongo";
import { COLLECTION } from "./query_api_method";
import { ObjectId } from "mongodb";

export default async function get_or_post(collection: COLLECTION, query: any, document: any) {
    const db = await get_db();
    const result = await execute_mongo_get(collection, query, false);
    if (result) {
        return result;
    }
    const inserted_id = await execute_mongo_post(collection, [document]).then((array: any) => array[0])
    return await db.collection(collection).findOne({ _id: new ObjectId(inserted_id) });
}