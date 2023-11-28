import { get_db } from "@/utils/mongo";
import wrap_api_function from "@/utils/wrap_api_function";
import { ObjectId } from "mongodb";

export default wrap_api_function(execute);

async function execute(body: any) {
    const salesbot_id = body.salesbot_id;
    const db = await get_db();
    return await db.collection("chat").aggregate([
        // Match chats with the specified salesbot_id
        {
            $match: {
                "salesbot": new ObjectId(salesbot_id)
            }
        },
        // Lookup messages related to the chat
        {
            $lookup: {
                from: "message",
                localField: "_id",
                foreignField: "chat",
                as: "relatedMessages"
            }
        },
        // Unwind the relatedMessages to process each message
        {
            $unwind: "$relatedMessages"
        },
        // Sort by chat and created timestamp
        {
            $sort: {
                "_id": 1,
                "relatedMessages.created": -1
            }
        },
        // Group by chat_id and push all related messages into arrays
        {
            $group: {
                _id: "$_id",
                messages: {
                    $push: {
                        text: "$relatedMessages.text",
                        is_bot: "$relatedMessages.is_bot",
                        created: "$relatedMessages.created"
                    }
                }
            }
        },
        // Filter out the last bot and non-bot messages
        {
            $project: {
                chat_id: "$_id",
                last_bot_message: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$messages",
                                as: "message",
                                cond: "$$message.is_bot"
                            }
                        }, 0]
                },
                last_user_message: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$messages",
                                as: "message",
                                cond: { $not: ["$$message.is_bot"] }
                            }
                        }, 0]
                }
            }
        },
        // Determine the latest timestamp between the last bot and non-bot messages
        {
            $addFields: {
                latest_timestamp: {
                    $max: [
                        "$last_bot_message.created",
                        "$last_user_message.created"
                    ]
                }
            }
        },
        // Project the fields in the required shape
        {
            $project: {
                chat_id: 1,
                last_bot_message: "$last_bot_message.text",
                last_user_message: "$last_user_message.text",
                latest_timestamp: 1
            }
        },
        // Sort by the latest timestamp
        {
            $sort: {
                "latest_timestamp": -1
            }
        }
    ]).toArray();


}