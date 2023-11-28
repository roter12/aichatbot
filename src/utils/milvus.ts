import { MilvusClient } from "@zilliz/milvus2-sdk-node";
const address = "https://in01-39f4859e3295a4c.aws-us-west-2.vectordb.zillizcloud.com:19535";
const username = "db_admin";
const password = "Roudnice1";
const ssl = true;
const milvusClient = new MilvusClient({ address, ssl, username, password });

// export async function upsert_vectors(vectors: { id: string, vector: number[] }[], collection_name : "product_data"|"rating") {
//     await milvusClient.insert({
//         collection_name,
//         fields_data: vectors,
//     });
// }

// export async function delete_vectors(ids: string[]) {
//     console.log("id in [" + ids.join(",") + "]");
//     const result = await milvusClient.deleteEntities({
//         collection_name: "product_data",
//         expr: "id in [" + ids.map(id => `'${id}'`).join(",") + "]"
//     });
//     console.log(result)
// }

// export async function find_similar_vectors(vector: number[], salesbot_id: string, collection_name : "product_data"|"rating", topk = "3") {
//     return await milvusClient.search({
//         collection_name,
//         search_params: {
//             anns_field: "vector",
//             topk,
//             metric_type: "L2",
//             params: JSON.stringify({ nprobe: 10 }),
//         },
//         vector: vector
//     }).then(result => result.results)
// }