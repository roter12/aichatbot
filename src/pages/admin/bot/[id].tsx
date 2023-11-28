import { Button, Checkbox, Collapse, Dropdown, Grid, Input, Loading, Modal, Text, Textarea } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react"
import { FaBrain, FaMagic, FaPlay, FaPlus, FaTrash } from "react-icons/fa";
import { COLLECTION, mongo_delete, mongo_post, mongo_put } from "@/utils/query_api_method";
import Chat from "@/components/Chat";
import { display_error, display_success } from "@/utils/notifications";
import useGet from "@/utils/hooks/useGet";
import { BsChat, BsChatFill, BsGear, BsGearFill, BsPeople } from "react-icons/bs";
import { IoLinkSharp } from "react-icons/io5";
import { TbPrompt, TbTransitionBottom } from "react-icons/tb";
import { GrDocumentStore } from "react-icons/gr";
import { BsChatSquareFill } from "react-icons/bs";
import Select from "@/components/Select";
import Card from "@/components/Card";
import { useRouter } from "next/router";
import useGetOrCreate from "@/utils/hooks/useGetOrCreate";
import Dialog from "@/components/Dialog";
import query_api from "@/utils/query_api";
import DataUploadButton from "@/components/DataUploadButton";
import DataTable from "@/components/DataTable";
import DataScrapeButton from "@/components/DataScrapeButton";
import { Action as ActionType, Chat as ChatType, Directory, MessageRating, SalesBot, Message as MessageType } from "../../api/[collection]/schemas";
import StateDiagram from "@/components/StateDiagram/index"
import create_new_directory from "@/utils/create_new_directory";
import Paginated from "@/components/Paginated";
import GradientBackground from "@/components/new/GradientBackground";
import add_data_to_source from "@/utils/add_data_to_source";

const Action = ({ data, remove, edit }: { data: ActionType, remove: () => void, edit: ($set: any) => Promise<void> }) => {

    const { condition, task } = data;
    const [is_loading, set_is_loading] = useState(false);

    const ACTIONS = ["Email", "Zapier", "Message"];
    const PARAMETERS = {
        "email": ["To", "Subject", "Body"],
        "zapier": ["Zapier URL"],
        "message": ["Text"]
    } as any;

    const parameters = PARAMETERS[task];

    async function edit_wrapped($set: any) {
        let any_changes = false;
        for (const key in $set) {
            if (JSON.stringify($set[key]) !== JSON.stringify((data as any)[key])) {
                any_changes = true;
                break;
            }
        }
        if (any_changes) {
            set_is_loading(true);
            await edit($set);
            set_is_loading(false);
        }
    }

    return is_loading
        ? <Loading />
        : <div className="my-3">
            <div className="inline-block w-[calc(100%-30px)]">
                <Input width="100%" css={{ marginBottom: "10px" }} type="text" initialValue={condition} placeholder="Condition" onBlur={e => edit_wrapped({ condition: e.target.value })} />
                <Select
                    keys={ACTIONS.map(s => s.toLocaleLowerCase())}
                    placeholder="Select Action"
                    selected={data.task}
                    onSelect={value => edit({ task: value })}
                    options={ACTIONS} />
                {
                    parameters?.map((parameter: string, index: number) =>
                        <Input
                            key={"parameter" + index}
                            width="100%"
                            css={{ marginBottom: "10px" }}
                            type="text"
                            initialValue={data.arguments ? data.arguments[parameter.toLocaleLowerCase()] : ""}
                            placeholder={parameter}
                            onBlur={e => edit_wrapped({
                                arguments: { ...(data.arguments || {}), [parameter.toLocaleLowerCase()]: e.target.value }
                            })} />
                    )
                }
            </div>
            <FaTrash className="inline-block cursor-pointer align-top mt-3 ml-2" onClick={remove} />
        </div >
}

const Member = ({ data, remove, edit }: { data: { email: string }, remove: () => void, edit: ($set: any) => Promise<void> }) => {

    const { email } = data;
    const [is_loading, set_is_loading] = useState(false);

    async function edit_wrapped($set: any) {
        set_is_loading(true);
        await edit($set);
        set_is_loading(false);
    }

    return is_loading
        ? <Loading />
        : <div className="my-3">
            <div className="inline-block w-[calc(100%-30px)]">
                <Input width="100%" css={{ marginBottom: "10px" }} type="email" initialValue={email} placeholder="Google Account Email" onBlur={e => edit_wrapped({ email: e.target.value })} />
            </div>
            <FaTrash className="inline-block cursor-pointer align-top mt-3 ml-2" onClick={remove} />
        </div >
}

const Actions = ({ salesbot_id }: { salesbot_id: string }) => {
    return <>
        <MultiDocumentInput query={{ salesbot: salesbot_id }} collection={COLLECTION.ACTION} Component={Action} new_document={() => (
            {
                salesbot: salesbot_id.toString(),
                condition: "data",
                task: "Send an email",
            }
        )} />
        <div className="h-[50px]" />
    </>
}

const Members = ({ salesbot_id }: { salesbot_id: string }) => {
    return <>
        <MultiDocumentInput query={{ salesbot: salesbot_id }} collection={COLLECTION.BOT_ACCESS} Component={Member} new_document={() => (
            {
                salesbot: salesbot_id.toString(),
                email: "",
            }
        )} />
        <div className="h-[50px]" />
    </>
}

const Transition = ({ data, remove, edit }: { data: any, remove: () => void, edit: ($set: any) => void }) => {

    const [update_index, set_update_index] = useState(0);
    const { state_to, condition } = data;
    const router = useRouter();
    const salesbot_id = router.query.id;

    const { data: all_states } = useGet<any[]>(COLLECTION.STATE, { salesbot: salesbot_id }, true, false);

    useEffect(() => {
        if (update_index >= 1) {
            mongo_put(COLLECTION.STATE, { _id: data._id }, { state_to, condition })
                .catch(display_error);
        }
    }, [update_index])

    function update(field: string, value: any) {
        edit({ [field]: value });
        set_update_index(update_index + 1);
    }

    if (!all_states) {
        return <Loading />
    }

    return <div className="mb-10">
        <div className="mb-2">
            <Textarea
                placeholder="Condition"
                initialValue={condition}
                bordered
                style={{ padding: "10px", height: "50px", minHeight: "30px", width: "320px", }}
                onBlur={e => update("condition", e.target.value)}
            />
        </div>
        <div className="w-[calc(100%-30px)] inline-block">
            <Select
                keys={all_states!.map(({ _id }) => _id)}
                options={all_states!.map(({ label }) => label)}
                onSelect={value => update("state_to", value)}
                selected={state_to.toString()}
                placeholder="Transition to" />
        </div>
        <FaTrash className="inline-block ml-1 cursor-pointer" onClick={remove} />
    </div>
}

const DescribeButton = ({ salesbot_id, on_success }: { salesbot_id: string, on_success?: Function }) => {
    const [is_open, set_is_open] = useState(false);
    const [is_generating, set_is_generating] = useState(false);
    const [script, set_script] = useState("");
    return <div className="inline-block">
        <Dialog title="Describe it!" close={() => set_is_open(false)} is_open={is_open}>
            <Textarea
                label="Description"
                placeholder="Figure out their industry. Then identify a pain point they had when they didn't have a pen on hand. Then pitch a pen to them using their painpoint and tailoring it to their industry."
                initialValue={""}
                bordered
                onBlur={e => set_script(e.target.value)}
                style={{ padding: "10px", height: "300px", minHeight: "100px", width: "500px" }}
            />
            <Button shadow color={"gradient"} disabled={is_generating} onClick={async () => {
                set_is_generating(true);
                await query_api("magic_init", { salesbot: salesbot_id, script })
                    .then(() => {
                        display_success("Magic done!");
                        if (on_success) {
                            on_success();
                        }
                    })
                    .catch(display_error)
                    .finally(() => {
                        set_is_generating(false);
                        set_is_open(false);
                    })
            }}>
                {is_generating ? <Loading /> : <FaMagic className="inline-block mr-1" />} Generate
            </Button>
        </Dialog>
        <Button shadow color={"gradient"} onClick={() => set_is_open(true)}>
            <FaMagic className="inline-block mr-1" /> Describe it!
        </Button>
    </div >
}

const StateUI = ({ salesbot_id }: { salesbot_id: string }) => {
    const { data: states, reload: reload_states, is_loading: is_loading_states } = useGet<any[]>(COLLECTION.STATE, { salesbot: salesbot_id }, true, false);
    const state_ids = states?.map(({ _id }) => _id);
    const { data: transitions, reload: reload_transitions, is_loading: is_loading_transitions } = useGet<any[]>(COLLECTION.TRANSITION, { state_from: { $in: state_ids } }, true, state_ids === undefined);

    useEffect(() => {
        reload_transitions();
    }, [states]);

    async function new_state() {
        await mongo_post(COLLECTION.STATE, [
            {
                salesbot: salesbot_id,
                label: "New State",
                prompt: "",
                storage: ""
            }
        ])
            .catch(display_error);
        reload_states();
    }

    return <>
        {/* <Dialog title="States" is_open={true} close={() => { }}> */}
        {
            !states || !transitions
                ? <Loading />
                : <StateDiagram key="original" reload={reload_states} states={states} transitions={transitions.filter(transition => transition.state_from && transition.state_to)} />

        }
        <div className="flex mt-3">
            <Button shadow css={{ width: "150px", marginRight: "5px", display: "inline-block" }} onClick={new_state} color="success" icon={<FaPlus />}>New State</Button>
            <DescribeButton salesbot_id={salesbot_id} on_success={() => { reload_states(); }} />
        </div>
        {/* </Dialog> */}
    </>
}

const States = ({ salesbot_id }: { salesbot_id: string }) => {
    return <>
        {/* <MultiDocumentInput query={{ salesbot: salesbot_id }} collection={COLLECTION.STATE} Component={Goal} new_document={() => (
      {
        salesbot: salesbot_id.toString(),
        label: "New State",
        prompt: "Ask for the industry",
        storage: "If the industry is mentioned, say {\"industry\": \"INDUSTRY\"}, otherwise say {}",
      }
    )} />
    <div className="h-[50px]" />
    <DescribeButton salesbot_id={salesbot_id} /> */}
        <StateUI salesbot_id={salesbot_id} />
    </>
}

const Context = ({ salesbot_id }: { salesbot_id: string }) => {

    const { data: salesbot, is_loading } = useGet<SalesBot>(COLLECTION.SALESBOT, { _id: salesbot_id }, false, false);

    const [response_prompt, set_response_prompt] = useState("");
    const [simulator_prompt, set_simulator_prompt] = useState("");
    const [post_process, set_post_process] = useState("");

    useEffect(() => {
        if (salesbot) {
            set_response_prompt(salesbot?.response_prompt);
            set_simulator_prompt(salesbot?.simulator_prompt);
            set_post_process(salesbot?.post_process);
        }
    }, [salesbot]);

    function save() {
        mongo_put(COLLECTION.SALESBOT, { _id: salesbot_id }, { response_prompt, simulator_prompt, post_process })
            .catch(display_error)
    }

    return <div>
        {
            is_loading
                ? <Loading />
                : <div>
                    <Textarea
                        width="100%"
                        initialValue={response_prompt}
                        onChange={e => set_response_prompt(e.target.value)}
                        onBlur={save}
                        bordered label="Salesbot Prompt"
                        placeholder="You are a sales bot whose goal it is to sell a pen." />
                    <div className="h-[20px]"></div>
                    <Textarea
                        width="100%"
                        initialValue={simulator_prompt}
                        onChange={e => set_simulator_prompt(e.target.value)}
                        onBlur={save}
                        bordered
                        label="Prompt for simulating responses"
                        placeholder="You are a bot simulating a potential customer. You are talking to a salesperson and you want to purchase a pen for the smallest price possible." />
                    <div className="h-[20px]"></div>
                    <Textarea
                        width="100%"
                        initialValue={post_process}
                        onChange={e => set_post_process(e.target.value)}
                        onBlur={save}
                        bordered
                        label="JavaScript post_process(text) function"
                        placeholder={`return text`} />
                </div>
        }
    </div>
}

const Conversation = ({ _id }: { _id: string }) => {

    const { data: messages } = useGet<MessageType[]>(COLLECTION.MESSAGE, { chat: _id }, true, false);
    // const { data: message_ratings } = useGet<MessageRating[]>(COLLECTION.MESSAGE_RATING, { chat: _id }, true, false);

    return <Collapse title={"Chat " + _id}>
        <div className="text-[12px] max-h-[300px] overflow-y-scroll pr-3">
            {messages?.map(({ text, is_bot }: { text: string, is_bot: boolean }, index: number) =>
                <div key={index}>
                    <div key={index} className={`my-2 ${is_bot ? "text-left" : "text-right"} `}>
                        <div className={`${is_bot ? "bg-black/5 mr-5" : "bg-[#0088FF] text-white text-right ml-5"} rounded-md p-2 inline-block`} key={index}>{text}</div>
                    </div>
                    {/* {message_ratings?.filter(({ message_index }) => message_index === index).map(({ is_positive, _id }) =>
                        <div key={_id.toString()} className={`translate-y-[-16px] ml-3 ${is_bot ? "text-left" : "text-right"} `}>
                            <div className={`${is_positive ? "bg-green-500" : "bg-red-500 text-white"} rounded-xl px-2 inline-block`}>{is_positive ? "Positive" : "Negative"}</div>
                        </div>
                    )} */}
                </div>
            )}
        </div>
    </Collapse>
}

const Conversations = ({ salesbot_id }: { salesbot_id: string }) => {

    return <Paginated collection={COLLECTION.CHAT} query={{ salesbot: salesbot_id }} render_elements={(chats) =>
        <>
            <Collapse.Group shadow divider={true} style={{ border: "1px solid #BBB", width: "100%", backgroundColor: "#F8F8F8" }}>
                {
                    chats?.map(({ _id }, index) =>
                        <Conversation _id={_id} key={_id.toString()} />
                    )
                }
            </Collapse.Group>
        </>
    } />
}

const Configuration = ({ salesbot_id }: { salesbot_id: string }) => {

    const { data: salesbot } = useGet<SalesBot>(COLLECTION.SALESBOT, { _id: salesbot_id }, false, false);

    async function update_settings(field: string, value: any) {
        let $set: any = {};
        $set["settings." + field] = value;
        await mongo_put(COLLECTION.SALESBOT, { _id: salesbot_id }, $set)
    }

    const SettingsInput = ({ field_name, label, placeholder, options, ...props }: { field_name: string, label: string, placeholder?: string, options?: string[] } & any) => {

        if (options) {
            return <>
                <p>{label}</p>
                <Select options={options} selected={salesbot?.settings[field_name] || options[0]} onSelect={option => update_settings(field_name, option)} keys={options} placeholder={label} />
            </>
        }

        return <Input
            initialValue={salesbot?.settings[field_name]}
            onBlur={(e) => update_settings(field_name, e.target.value)}
            label={label}
            placeholder={placeholder || label}
            css={{ width: "100%" }}
            className="mb-5"
            {...props} />
    }

    const HttpsInput = ({ field_name, label, placeholder }: { field_name: string, label: string, placeholder?: string }) => {
        return <SettingsInput field_name={field_name} label={label} placeholder={placeholder}
            onChange={(e: any) => {
                const value = e.target.value;
                if (value.startsWith("https://")) {
                    e.target.value = value.replace("https://", "");
                }
            }}
            type="url"
            labelLeft="https://"
        />
    }

    const SettingsFirstMessages = () => {
        const [is_open, set_is_open] = useState(false);
        const [first_messages, set_first_messages] = useState<any[]>(salesbot?.settings.first_messages || []);

        function update_first_messages(new_first_messages: { is_bot: boolean, text: string }[]) {
            set_first_messages(new_first_messages)
            update_settings("first_messages", new_first_messages);
        }

        return <div>
            <Dialog is_open={is_open} close={() => set_is_open(false)} title="First Messages">
                {
                    first_messages.map((message, index) =>
                        <div key={index} className="my-3 flex">
                            <Checkbox
                                isSelected={message.is_bot}
                                onChange={checked => {
                                    first_messages[index].is_bot = checked;
                                    update_first_messages([...first_messages]);
                                }
                                } />
                            <Textarea
                                minRows={1}
                                css={{ width: "400px", marginRight: "10px", marginLeft: "10px" }}
                                initialValue={message.text}
                                onBlur={e => {
                                    first_messages[index].text = e.target.value;
                                    update_first_messages([...first_messages]);
                                }}
                            />
                            <FaTrash className="translate-y-[10px]" onClick={() => {
                                first_messages.splice(index, 1);
                                update_first_messages([...first_messages]);
                            }} />
                        </div>
                    )
                }
                <Button shadow style={{ width: "100px" }} color={"success"} onClick={() => {
                    first_messages.push({ text: "", is_bot: false });
                    update_first_messages([...first_messages]);
                }}>Add</Button>
            </Dialog>
            <Button onClick={() => set_is_open(true)}>
                <BsChatFill className="inline-block mr-1" /> First Messages
            </Button>
        </div>
    }

    return salesbot
        ? <div>
            <SettingsInput field_name="name" label="Name of your chatbot" placeholder="Example.org Assistant" />
            <SettingsInput field_name="chatgpt_model" label="ChatGPT Model" options={["gpt-3.5-turbo-16k", "gpt-4", "gpt-4-1106-preview"]} />
            <SettingsInput field_name="openai_key" label="OpenAI API Key" />

            <SettingsInput type="number" field_name="memory_association_per_response" label="Memory Association Per Response" />
            <SettingsInput type="number" field_name="chat_history_memory_in_characters" label="Chat History Memory in Characters" />

            <SettingsInput field_name="voice_platform" label="Voice Platform" options={["coqui", "elevenlabs"]} />
            <SettingsInput field_name="voice_id" label="Voice ID" />
            <SettingsInput field_name="elevenlabs_api_key" label="Elevenlabs Api Key" />
            <SettingsInput field_name="voice_speed" label="Voice Speed" />
            <SettingsInput field_name="send_as_voice_probability" label="Probability of Voice Messages" />
            <SettingsInput field_name="telegram_api_key" label="Telegram API Key" />
            <SettingsInput field_name="telegram2_phone_number" label="Telegram Account Phone Number" />
            <SettingsInput field_name="telegram2_auth_code" label="Telegram Account Auth Code" />
            <SettingsInput field_name="instagram_api_key" label="Instagram API Key" />
            <SettingsInput field_name="instagram_page_id" label="Instagram Page ID" />
            <SettingsInput field_name="instagram_user_id" label="Instagram User ID" />
            <SettingsInput field_name="delay_exponent_min" label="Delay Exponent Min" />
            <SettingsInput field_name="delay_exponent_max" label="Delay Exponent Max" />
            <SettingsInput field_name="preview_replies" label="Preview replies?" options={["false", "true"]} />
            <HttpsInput field_name="icon_url"
                label="Icon url"
                placeholder="example.org/icon.png" />
            <SettingsFirstMessages />
        </div>
        : <Loading />
}

const Settings = ({ chat_id, salesbot_id }: { chat_id: string, salesbot_id: string }) => {
    return <div className="absolute top-3 left-3 bottom-3 shadow-xl">
        <Collapse.Group accordion={false} shadow divider={true} style={{ border: "1px solid #BBB", width: "480px", backgroundColor: "#F8F8F8" }}>
            <Collapse title={<div className="text-[24px]"><BsGearFill className="inline-block mr-2" /> Configuration</div >} subtitle="Configure your chatbot">
                <div className="border rounded-xl p-5 bg-white">
                    <Configuration salesbot_id={salesbot_id} />
                </div>
            </Collapse>
            <Collapse title={<div className="text-[24px]"><TbPrompt className="inline-block" /> Context</div >} subtitle="Define the context of the conversation.">
                <div className="border rounded-xl p-5 bg-white">
                    <Context salesbot_id={salesbot_id} />
                </div>
            </Collapse>
            <Collapse title={<div className="text-[24px]"><TbTransitionBottom className="inline-block mr-2" /> Chatflow</div >} subtitle="Define conversation states and transitions.">
                <div className="border rounded-xl p-5 bg-white">
                    <States salesbot_id={salesbot_id} />
                </div>
            </Collapse>
            <Collapse title={<div className="text-[24px]"><GrDocumentStore className="inline-block mr-2" /> Knowledge Base</div >} subtitle="Expand your chatbot's knowledge with data.">
                <div className="border rounded-xl p-5 bg-white">
                    <Data salesbot_id={salesbot_id} />
                </div>
            </Collapse>
            <Collapse title={<div className="text-[24px]"><BsChatSquareFill className="inline-block mr-2" /> Conversations</div >} subtitle="Past Chat Conversations">
                <div className="border rounded-xl p-5 bg-white h-[2000px]">
                    <Conversations salesbot_id={salesbot_id} />
                </div>
            </Collapse>
            <Collapse title={<div className="text-[24px]"><FaBrain className="inline-block mr-2" /> Memory</div >} subtitle="Data stored during the current conversation.">
                <div className="border rounded-xl p-5 bg-white">
                    <Memory chat_id={chat_id} />
                </div>
            </Collapse>
            <Collapse title={<div className="text-[24px]"><FaPlay className="inline-block mr-2" /> Actions</div >} subtitle="Automate actions triggered by changes in memory.">
                <div className="border rounded-xl p-5 bg-white">
                    <Actions salesbot_id={salesbot_id} />
                </div>
            </Collapse>
            <Collapse title={<div className="text-[24px]"><BsPeople className="inline-block mr-2" /> Collaborators</div >} subtitle="Automate actions triggered by changes in memory.">
                <div className="border rounded-xl p-5 bg-white">
                    <Members salesbot_id={salesbot_id} />
                </div>
            </Collapse>
        </Collapse.Group>
    </div>
}

const MultiDocumentInput = ({ collection, Component, new_document, query }
    : {
        collection: COLLECTION,
        Component: (props: { data: any, remove: () => void, edit: ($set: any) => Promise<void> }) => any,
        new_document: () => any,
        query: any
    }) => {
    const { data: documents, reload: reload } = useGet<any[]>(collection, query, true, false);

    function add_document() {
        const new_goal: any = new_document();
        mongo_post(collection, [new_goal])
            .then(reload)
            .catch(display_error);
    }

    function delete_document(_id: string) {
        mongo_delete(collection, { _id })
            .then(reload)
            .catch(display_error);
    }

    async function edit_document(_id: string, $set: any) {
        await mongo_put(collection, { _id }, $set)
            .then(reload)
            .catch(display_error);
    }

    return <>
        <div className="py-10">
            {documents?.map((document) =>
                <Component
                    data={document}
                    key={document._id}
                    remove={() => delete_document(document._id.toString())}
                    edit={async ($set: any) => await edit_document(document._id.toString(), $set)}
                />
            )}
        </div>
        <Button color={"success"} icon={<FaPlus />} style={{ width: "150px" }} shadow onClick={add_document}>Add {collection}</Button>
    </>
}
const Data = ({ salesbot_id }: { salesbot_id: string }) => {
    return <>
        <DataTable salesbot_id={salesbot_id} />
        <DataUploadButton accepted_extensions={[".pdf", ".docx", ".txt", ".mp3", ".wav"]} id={"knowledge"} on_success={
            async (paths: string[]) => {
                for (const path of paths) {
                    await query_api('file/extract', { path })
                        .then(async (pages) => {
                            console.log(pages);
                            // return;
                            const source_id: string = await create_new_directory(salesbot_id, path, path.split('.').pop()?.toUpperCase() + ' Upload');
                            Promise.all(
                                pages.map((page: string, index: number) =>
                                    add_data_to_source(salesbot_id.toString(), page, path + ' (p. ' + (index + 1) + ')', source_id)
                                )
                            )

                        })
                        .catch(display_error);
                }
            }
        } />
        <DataScrapeButton salesbot_id={salesbot_id} />
    </>
}

const Memory = ({ chat_id }: { chat_id: string }) => {

    const { data: chat, is_loading, reload } = useGet<{ memory: any }>(COLLECTION.CHAT, { _id: chat_id }, false, false);

    return <div className="w-[100%]">
        {
            is_loading
                ? <Loading />
                : <><Textarea initialValue={
                    JSON.stringify(chat?.memory, null, 4)
                } minRows={10} bordered style={{ padding: "10px", height: "300px", width: "300px", color: "#000" }}>
                </Textarea>
                <Button css={{ marginTop: "10px" }} shadow color="error" onClick={() => {
                    mongo_put(COLLECTION.CHAT, { _id: chat_id }, { memory: {} })
                        .then(reload)
                }}><FaTrash className="inline-block mr-1" /> Reset</Button>
                </>
        }
    </div>
}

declare global {
    interface Window {
        salesbot: any;
    }
}


const ChatLoader = ({ salesbot_id }: { salesbot_id: string }) => {

    const { data: salesbot } = useGet<SalesBot>(COLLECTION.SALESBOT, { _id: salesbot_id }, false, false);

    const settings = {
        id: salesbot_id,
        ...salesbot?.settings,
        // name: "AutomateExcel",
        icon_url: "https://www.automateexcel.com/excel/wp-content/uploads/2018/03/gears.png",
        icon_color: "#EEEEEE",
        first_messages: salesbot?.settings.first_messages || [],
    }

    const [is_loaded, set_is_loaded] = useState(false);
    const ref = useRef();
    const [rect, setRect] = useState({ top: 0, left: 0 });

    function update_rect() {
        setRect((ref.current as any).getBoundingClientRect());
    }

    useEffect(() => {
        if (is_loaded && ref.current) {
            update_rect();
            window.addEventListener('resize', update_rect)
            return () => window.removeEventListener('resize', update_rect)
        } else {
        }
    }, [ref.current, is_loaded]);

    useEffect(() => {
        window.salesbot = settings;
    }, [settings]);


    useEffect(() => {
        if (salesbot) {
            const interval = setInterval(() => {
                if (ref.current) {
                    set_is_loaded(true);
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [salesbot])

    return settings
        ? <div>
            <div ref={ref as any} style={{
                position: 'fixed',
                bottom: '120px',
                right: '50px',
                width: '400px',
                height: '700px',
                zIndex: -1
            }} className="chatbot_box">
            </div>
            {
                is_loaded
                    ? <Chat
                        salesbot_id={settings.id}
                        rect={rect}
                        is_always_open={true}
                        is_never_fullscreen={false}
                        on_new_message={(message: any) => { }} />
                    : null
            }
        </div>
        : <div></div>
}

export default function Home() {

    const router = useRouter();
    const salesbot_id = router.query.id as string;

    const { data: chat } = useGetOrCreate<{ _id: string }>(COLLECTION.CHAT, { salesbot: salesbot_id, identifier: "test" }, {
        salesbot: salesbot_id,
        memory: {},
        identifier: "test"
    }, salesbot_id === undefined)

    if (!salesbot_id) {
        return <div className="p-10">
            <Text size={26} style={{ fontWeight: "600" }}>Please select a bot</Text>
        </div>
    }

    if (!chat) {
        return <div className="p-10">
            <Loading />
        </div>
    }

    return (
        <>
            <GradientBackground />
            <div className="absolute m-10">
                <Settings chat_id={chat._id} salesbot_id={salesbot_id} />
                <div className="inline-block absolute left-[500px] align-top m-5">
                    <ChatLoader salesbot_id={salesbot_id} />
                    {/* <Chat on_new_message={update} chat_id={chat._id} is_always_open={true} rect={} /> */}
                </div>
            </div>
        </>
    )
}
