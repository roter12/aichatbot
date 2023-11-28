import { COLLECTION, mongo_post } from "@/utils/query_api_method";
import { query_open_ai } from "@/utils/query_open_ai";
import wrap_api_function from "@/utils/wrap_api_function";
import { ObjectId } from "mongodb";
import { execute_mongo_get } from "./[collection]";
import { SalesBot } from "./[collection]/schemas";

async function insert_states(states: any[]) {
    return await mongo_post(COLLECTION.STATE, states);
    // const collection = db.collection(COLLECTION.STATE);
    // const result = await collection.insertMany(states);
    // return Object.values(result.insertedIds);
}

async function insert_transitions(transitions: any[]) {

    await mongo_post(COLLECTION.TRANSITION, transitions);

    // const collection = db.collection(COLLECTION.TRANSITION);
    // await collection.insertMany(transitions)
}

function replace_state_labels_with_ids(state_ids: ObjectId[], states: any[], transitions: any[]) {
    const state_id_by_label = Object.fromEntries(state_ids.map((id, index) => [states[index].label, id]));
    return transitions.map(transition => ({
        ...transition,
        state_from: state_id_by_label[transition.state_from.toString()],
        state_to: state_id_by_label[transition.state_to.toString()],
    }));
}

async function execute(data: any) {


    const salesbot_id = new ObjectId(data.salesbot);
    const salesbot = await execute_mongo_get(COLLECTION.SALESBOT, { _id: salesbot_id }, false) as SalesBot;
    const result_string = await query_open_ai([
        {
            "role": "user",
            "content": `Take the following sales script and convert it into states and transitions for a chatbot.
            Each state has a label, an AI prompt task description (e.g. "ask for the user's budget", and instructions to store data in the chatbot's memory.
            In the task description, you can use edgy brackets with the variable name like "[age]" to insert data from the memory into the prompt. This is necessary whenever the prompt wants to access previously stored information. For example "Ask them what it is like to be [age] years old.".
            Keep in mind: The task description is not directly presented to the user. Instead, it will be sent to OpenAI as a prompt and what is returned will be shown to the user.
            So do not write exactly what the user should see into the task description. Do not write "What's your age?" but instead "Ask them what their age is.".
            Also load all information from the memory into the prompt. For example: instead of "Compliment them about their age" write "Compliment them about their age which is [age]".
            Each transition must specify the label of the state from which it transitions, the label of the state to which it transitions and as condition the name of the variable that must exist in the memory for the transition to take place (e.g. 'age'). The condition should only be the variable name, no boolean expression.
            The chatbots memory is a JSON object.
            The data storage instructions will be executed as an ai prompt, together with all the chat history. It must return a JSON object. All fields of that JSON objects with their respective values will be added to the memory.
            An example for a storage instruction would be: \`If they mention their age, say {"age": "[THEIR AGE]"}, otherwise say {}\` (make sure to use ", not ')
            Another example for an instruction that doesn't store anything: \'Say {"instruction_4_completed": "true"}\'. Then you can use 'instruction_4_completed' as condition to transition to the next state.
            Return states and transitions in this format:
            {
              "states": [
                { "label": "...", "prompt": "...", "storage": "..."},
                ...
              ],
              "transitions": [
                {"state_from": "...", "state_to": "...", condition: "..."}
              ]
            }
            
            ==== SCRIPT START ====
            ${data.script}
            ==== SCRIPT END ====`
        }
    ], "gpt-4", salesbot.settings.openai_key);
    console.log(result_string);
    const result_json = JSON.parse(result_string);
    const states = result_json.states.map((state: any) => ({ ...state, salesbot_id }));
    const state_ids = await insert_states(states);
    const transitions = replace_state_labels_with_ids(state_ids, states, result_json.transitions);
    await insert_transitions(transitions);
}

export default wrap_api_function(execute);