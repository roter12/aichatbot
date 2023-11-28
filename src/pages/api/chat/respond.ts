
import { get_db } from "@/utils/mongo";
import { COLLECTION, mongo_delete, mongo_get, mongo_post } from "@/utils/query_api_method";
import { query_open_ai } from "@/utils/query_open_ai";
import { find_similar_vectors, vectorize } from "@/utils/vectors";
import wrap_openai_stream from "@/utils/wrap_openai_stream";
import { ObjectId } from "mongodb";
import { Action, Chat, MentalNotebook, Message, SalesBot, Text } from "../[collection]/schemas";
import moment from "moment";
import { execute_mongo_delete, execute_mongo_get, execute_mongo_post } from "../[collection]";
import wrap_api_function from "@/utils/wrap_api_function";
import get_balance from "@/utils/get_balance";
import send_email from "../utils/send_email";

type LocalMessage = { text: string, is_self: boolean, created: number };

const ENABLE_REFERENCES = process.env.ENABLE_REFERENCES === "true";
const ENABLE_PAYMENT = process.env.ENABLE_PAYMENT === "true";

let db: any;

async function get_memory(chat_id: ObjectId) {
    const chat = await db.collection(COLLECTION.CHAT).findOne({ _id: chat_id });
    return chat!.memory;
}

async function get_state(chat_id: ObjectId): Promise<any> {
    const memory = await get_memory(chat_id);
    if (memory.state) {
        const state_id = new ObjectId(memory.state);
        const state = await db.collection(COLLECTION.STATE).findOne({ _id: state_id }) as unknown as any;
        if (!state) {
            await reset_memory(chat_id);
            return await get_state(chat_id);
        }
        return state;
    } else {
        const chat = await db.collection(COLLECTION.CHAT).findOne({ _id: chat_id });
        const first_state = (await db.collection(COLLECTION.STATE).find({ salesbot: chat!.salesbot }).sort({ created: 1 }).limit(1).toArray())[0]! as unknown as any;
        if (!first_state) {
            throw new Error("Please add at least one state for this chat.");
        }
        return first_state;
    }
}

async function reset_memory(chat_id: ObjectId) {
    await db.collection(COLLECTION.CHAT).updateOne({ _id: chat_id }, { $set: { memory: {} } });
}

function fill_in_variables(target: string, variables: any) {
    for (const field of Object.keys(variables)) {
        target = target.replaceAll(`[${field}]`, variables[field]);
    }
    return target;
}

async function fetch_data_to_respond_to(salesbot_id: string, message: string, openai_api_key: string) {
    const vector = await vectorize(message, openai_api_key);
    const similar_vectors: { id: string }[] = await find_similar_vectors(vector, salesbot_id, 1);
    const similar_ids = similar_vectors.map(({ id }: { id: string }) => new ObjectId(id));
    const similar_data = await db.collection(COLLECTION.CHUNK).find({ _id: { $in: similar_ids } }).toArray();
    return await Promise.all(similar_data.map(async ({ text: text_id, content }: any) => {
        // return "=== " + _id.toString() + " ===\n" + content;
        const text = await db.collection(COLLECTION.TEXT).findOne({ _id: text_id }) as Text;
        return "=== " + text.name + " ===\n" + content;
    })).then((result) => result.join("\n\n"));
}

function messages_to_string(messages: LocalMessage[]) {
    return messages.map(({ text, is_self, created }) => ((is_self ? "User" : "Bot") + ": " + text)).join("\n");
}

function get_last_messages_with_max_text_length(messages: LocalMessage[], max_text_length: number) {
    const last_messages = [];
    const MAX_MESSAGE_LENGTH = 500;
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.text.length <= max_text_length) {
            last_messages.push(message.text.length > MAX_MESSAGE_LENGTH
                ? ({
                    ...message,
                    text: message.text.substring(0, MAX_MESSAGE_LENGTH) + "..."
                })
                : message
            );
            max_text_length -= Math.min(message.text.length, MAX_MESSAGE_LENGTH);
        } else {
            break;
        }
    }
    return last_messages;
}

async function change_memory(openai_key: string, chat_id: ObjectId, messages: LocalMessage[]) {
    const state = await measure_time(get_state(chat_id), "get_state");

    if (["{}", "say {}", ""].includes(state.storage)) {
        return;
    }

    const memory = await measure_time(get_memory(chat_id), "get_memory");

    const last_messages = get_last_messages_with_max_text_length(messages, 1000);;
    const chat_history = messages_to_string(last_messages);

    const storage_result =
        await query_open_ai([
            {
                "role": "system",
                "content": "=== CHAT HISTORY ===\n" + chat_history + "\n=== END OF CHAT HISTORY ===\n\nPrevious state / Memory:\n" + JSON.stringify(memory, null, 4) + "\n\n" + state.storage.replaceAll("\'", "\"")
            }
        ], "gpt-3.5-turbo-16k", openai_key, 1024)
            .then(result => {
                try {
                    return result.trim().length === 0
                        ? {}
                        : JSON.parse(result.substring(
                            result.indexOf("{"),
                            result.lastIndexOf("}") + 1));
                } catch (error) {
                    console.log("Could not parse storage result: " + result);
                    return {};
                }
            })

    const chat = await db.collection(COLLECTION.CHAT).findOne({ _id: chat_id }) as Chat;
    const new_memory = { ...memory, ...storage_result };
    await trigger_actions(chat.salesbot, memory, new_memory, chat._id.toString())
    await db.collection(COLLECTION.CHAT).updateOne({ _id: chat_id }, { $set: { memory: new_memory } });
}

async function trigger_actions(salesbot_id: ObjectId, old_memory: any, new_memory: any, chat_id: string) {
    const actions = await db.collection(COLLECTION.ACTION).find({ salesbot: salesbot_id }).toArray() as Action[];
    for (const action of actions) {
        if (!old_memory[action.condition] && new_memory[action.condition]) {
            await perform_action(action.task, action.arguments, new_memory, chat_id);
        }
    }
}

async function trigger_actions_by_message(salesbot_id: ObjectId, message: string) {
    const actions = await db.collection(COLLECTION.ACTION).find({ salesbot: salesbot_id }).toArray() as Action[];
    for (const action of actions) {
        if (action.task === "message" && action.condition.toLowerCase() === message.toLowerCase()) {
            return action.arguments['text'];
        }
    }
    return undefined;
}

async function perform_action(task: string, arguments_: any, memory: any, chat_id: string) {
    if (task === "email") {
        const formatted = Object.keys(memory).map(key => key + ": " + memory[key]).join("<br/>")
        await send_email("Action triggered", "A prospect entered their email:<br/><br/>" + formatted, arguments_.to);
    }
    if (task === "zapier") {
        const chat = await db.collection(COLLECTION.CHAT).findOne({ _id: new ObjectId(chat_id) }) as Chat;
        await mongo_post(COLLECTION.MEMORY_SNAPSHOT, [
            {
                memory,
                chat: chat_id,
                salesbot: chat.salesbot.toString()
            }
        ])
    }
}

async function transition(chat_id: ObjectId) {
    const memory = await get_memory(chat_id);
    const state = await get_state(chat_id);
    const transitions = await db.collection(COLLECTION.TRANSITION).find({ state_from: state._id }).toArray();

    for (const transition of transitions) {

        if (transition.condition.includes(">=")) {
            const [field, value] = transition.condition.split(">=").map((x: string) => x.trim());
            if (memory[field] >= value) {
                memory.state = transition.state_to.toString();
                await db.collection(COLLECTION.CHAT).updateOne({ _id: chat_id }, { $set: { memory } });
                return await get_state(chat_id);
            }
        } else {
            if (transition.condition.length > 0 && memory[transition.condition]) {
                memory.state = transition.state_to.toString();
                await db.collection(COLLECTION.CHAT).updateOne({ _id: chat_id }, { $set: { memory } });
                return await get_state(chat_id);
            }
        }
    }
}

function format_time(unix: number) {
    return moment(unix * 1000).format("YYYY-MM-DD HH:mm:ss");
}

async function respond(chat_id: ObjectId, messages: LocalMessage[]) {

    const chat = await measure_time(db.collection(COLLECTION.CHAT).findOne({ _id: chat_id })) as Chat;
    const salesbot = await measure_time(db.collection(COLLECTION.SALESBOT).findOne({ _id: chat!.salesbot })) as SalesBot;
    const state = await measure_time(get_state(chat_id));
    const memory = await measure_time(get_memory(chat_id));

    const balance = await get_balance(chat!.identifier, chat_id.toString());

    const state_prompt = fill_in_variables(state.prompt, memory);

    const last_message = messages[messages.length - 1].text;
    const product_data = await measure_time(fetch_data_to_respond_to(chat!.salesbot.toString(), last_message, salesbot.settings.openai_key));

    const last_messages = get_last_messages_with_max_text_length(messages, salesbot.settings.chat_history_memory_in_characters);
    const last_messages_inversed = last_messages.slice().reverse();
    const chat_history = messages_to_string(last_messages_inversed);

    const result = await trigger_actions_by_message(chat!.salesbot, last_message);
    if (result) {
        throw result;
    }

    const message_memory = await construct_message_memory(last_message, chat_id.toString(), salesbot);

    const mental_notebook = await execute_mongo_get(COLLECTION.MENTAL_NOTEBOOK, { chat: chat_id }, true, 40, { created: -1 }) as MentalNotebook[];

    const prompt = salesbot.response_prompt + "\n" + (salesbot.settings.prompt_addition || "")
        + (JSON.stringify(memory) !== "{}" && memory !== undefined && memory !== null && memory !== ""
            ? (
                "Your goal for the next response is: " + state_prompt
                + "\n" + JSON.stringify(memory)
                + (product_data.length > 0 ?
                    "\n\nYou can reference this data in your reply. " + (ENABLE_REFERENCES ? " If you use it, say 'According to ID {ID}' where '{ID}' is what is between the '===':" : "") + "\n\n"
                    + product_data
                    : ""
                )
                + "\n\n -------\n\n"
            )
            : "")

        + "RELATED PREVIOUS CONVERSATIONS:\n"
        + "\n\n -------\n\n"
        + message_memory
        + "\n\n -------\n\n"
        + "\n\n Current Time: " + format_time(moment().unix()) + "\n\n"
        + "\n\n User's Balance: $" + (balance / 100).toFixed(2) + " \n\n"
        + "\n\nYOUR MEMORY:\n"
        + "\n -------\n\n"
        + "[ID]: [FACT]"
        + "64d623e7e28ee80842c22a33:The sky is blue"
        + mental_notebook.map(({ _id, text }) => _id + ": " + text).join("\n")
        + "\n\n -------\n\n"
        + "Facts in your memory above will be remembered by you until you forget them. This is your tool to take down notes like your mood, your goals, or anything else you want to remember.\n"
        + "Remember/add facts by adding the facts to the 'remember' string array in the response."
        + "Forget/remove facts by adding their IDs to the 'forget' string array in the response.\n"
        + "For example, if you want to remember that you are happy and forget the item with ID 64d623e7e28ee80842c22a33, say {\"message\":\"...\", \"remember\": [\"I am happy\"], \"forget\": [\"64d623e7e28ee80842c22a33\"]}."


        + "\n\n -------\n\n"
        + "CHAT HISTORY:\n"
        + chat_history
        + `\n\n------ Now reply to the user in this format: \n\n{
            \"message\": <YOUR RESPONSE TO THE USER AS A STRING, e.g. \"Okay, I forgive you\”>,
            \"remember\": <FACTS TO REMEMBER, e.g. [\"I am happy.\"]>
             \"forget\": <IDS OF FACTS TO FORGET, e.g. [\"64d623e7e28ee80842c22a33\"]>
            } ` + (ENABLE_REFERENCES ? "If you use any of the above data, say 'According'." : "")

    return prompt;
}

async function measure_time(promise: Promise<any>, name?: string) {
    // const time_start = new Date().getTime();
    const result = await promise;
    // console.log((name || "") + "-----> " + (new Date().getTime() - time_start) + "ms");
    return result;
}

async function execute(chat_id: ObjectId, messages: LocalMessage[]) {
    db = await get_db();
    const { openai_key } = await get_settings_from_chat_id(chat_id);
    await measure_time(change_memory(openai_key, chat_id, messages), "change memory");
    await measure_time(transition(chat_id));
    return await measure_time(respond(chat_id, messages));
}

async function store_conversation(chat_id: string | ObjectId, messages: { is_bot: boolean, text: string }[]) {
    await mongo_delete(COLLECTION.CONVERSATION, { chat: chat_id.toString() });
    await mongo_post(COLLECTION.CONVERSATION, [
        {
            chat: chat_id.toString(),
            messages,
        }
    ]);
}

async function construct_message_memory(last_message: string, chat_id: string, salesbot: SalesBot) {
    const message_memory_vectors = await find_similar_vectors(await vectorize(last_message, salesbot.settings.openai_key), "memory_" + chat_id, salesbot.settings.memory_association_per_response);
    const message_memory_ids = message_memory_vectors.map(({ id }: { id: string }) => new ObjectId(id));
    const message_memory_messages = await db.collection(COLLECTION.MESSAGE).find({ _id: { $in: message_memory_ids } }).toArray()

    const promises = message_memory_messages.map(async (message: Message) => {
        const next_three_messages = await execute_mongo_get(COLLECTION.MESSAGE, { chat: chat_id, created: { $gt: message.created } }, true, 3, { created: 1 }) as Message[];
        const messages = [message, ...next_three_messages];
        return messages.map(({ text, is_bot, created }: { created: number, text: string, is_bot: boolean }) =>
            ((is_bot ? "Bot" : "User") + " [at " + (format_time(created)) + "]" + ": " + text)
        ).join("\n");
    });

    const message_memory = (await Promise.all(promises)).join("\n\n");
    return message_memory;
}

async function process_forget_and_remember(forget: string[], remember: string[], chat_id: ObjectId) {
    for (const id of forget.filter(id => id.length > 0)) {
        await execute_mongo_delete(COLLECTION.MENTAL_NOTEBOOK, { _id: new ObjectId(id) });
    }

    for (const text of remember) {
        await execute_mongo_post(COLLECTION.MENTAL_NOTEBOOK, [{ chat: chat_id, text }]);
    }
}

type OwnMessage = { text: string, is_self: boolean, created: number };

async function inner(body: any) {

    const messages = body.messages as OwnMessage[];
    const image_url: string | undefined = body.image_url;

    const messages_formatted = messages.map(({ text, is_self, created }: OwnMessage) => ({
        role: is_self ? 'user' : 'assistant',
        content: text || ''
    }));

    let prompt;

    const last_message = messages[messages.length - 1].text;
    prompt = await execute(new ObjectId(body.chat_id), messages);

    let { chatgpt_model, openai_key } = await get_settings_from_chat_id(new ObjectId(body.chat_id));


    const messages_with_context = [
        ...messages_formatted,
        { role: 'system', content: prompt },
    ] as { role: 'user' | 'assistant' | 'system', content: string }[];

    if (image_url && chatgpt_model === "gpt-4-1106-preview") {
        chatgpt_model = "gpt-4-vision-preview";
        // remove last element
        messages_with_context.push({
            role: 'user',
            content: [
                { "type": "text", "text": last_message },
                {
                    "type": "image_url",
                    "image_url": image_url
                },
            ]
        } as any)
    }

    const response = await query_open_ai(messages_with_context, chatgpt_model, openai_key);

    try {
        const json = JSON.parse(response);
        await process_forget_and_remember(json.forget || [], json.remember || [], new ObjectId(body.chat_id));
        return json.message;
    } catch (error) {
        if (ENABLE_PAYMENT) {
            return response;
        } else {
            console.log(response);
            return response.replaceAll('"message":', "")
        }
    }
}

export default wrap_api_function(inner);

async function get_settings_from_chat_id(chat_id: ObjectId) {
    const db = await get_db();
    const chat = await db.collection(COLLECTION.CHAT).findOne({ _id: chat_id }) as Chat;
    const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: chat!.salesbot }) as SalesBot;
    return salesbot.settings;
}