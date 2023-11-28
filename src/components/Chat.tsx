import React, { useContext, useEffect } from 'react';
import { FaPaperPlane, FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import { IoIosCopy } from 'react-icons/io';
import { BsArrowsFullscreen, BsFullscreen, BsRobot } from 'react-icons/bs';
import { display_error, display_success } from '@/utils/notifications';

import { Badge, Button } from '@nextui-org/react';
import query_api from '@/utils/query_api';
import { COLLECTION, mongo_delete, mongo_post } from '@/utils/query_api_method';
import useGet from '@/utils/hooks/useGet';
import useGetOrCreate from '@/utils/hooks/useGetOrCreate';
import { Chat, SalesBot } from '@/pages/api/[collection]/schemas';

declare type ContextType = {
    settings: {
        name: string;
        icon_color: string;
        icon_url: string;
        message_color: string;
        first_messages: { is_bot: boolean, text: string }[];
    };
    is_fullscreen: boolean;
    set_fullscreen: (value: boolean) => void;
    is_simulating: boolean,
    simulate: Function,
    is_responding: boolean,
    count_unread: number,
    set_count_unread: (value: number) => void
};

const default_value: ContextType = {
    settings: {
        name: 'Chatbot Name',
        icon_color: '#000000',
        icon_url: '',
        message_color: '#8888FF',
        first_messages: [
            {
                is_bot: true,
                text: 'Hello!',
            }
        ]
    },
    is_fullscreen: false,
    set_fullscreen: (value: boolean) => { },
    is_simulating: false,
    simulate: () => { },
    is_responding: false,
    count_unread: 0,
    set_count_unread: () => { }
};

const ChatContext = React.createContext(default_value);

const Message = ({ is_self, children, label }: { is_self: boolean; children: any, label?: string | undefined }) => {
    const { settings } = React.useContext(ChatContext);

    if (children == '') {
        return <div></div>;
    }

    const tag_colors = {
        "rejection": "error",
        "objection": "warning",
        "interest signal": "primary",
        "question": "secondary",
        "purchase intent": "success",
        "other": "default"
    } as any;

    return (
        <div style={{ margin: '0.5rem auto', width: '100%', textAlign: is_self ? 'right' : 'left' }}>
            <div
                style={{
                    paddingTop: '0.25rem',
                    paddingBottom: '0.25rem',
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem',
                    borderRadius: '0.375rem',
                    display: 'inline-block',
                    marginLeft: is_self ? '30px' : '0',
                    marginRight: is_self ? '0' : '30px',
                    backgroundColor: is_self ? settings.message_color : 'rgba(0,0,0,0.05)',
                    color: is_self ? 'white' : 'black'
                }}
            >
                {children}
            </div>
        </div>
    );
};


const ThumbsButton = ({ is_positive, rate, is_selected }: { is_positive: boolean, is_selected: boolean, rate: (value: boolean | undefined) => void }) => {
    return <div style={{
        backgroundColor: is_selected
            ? is_positive ? "#00BB44" : "#BB0000"
            : is_positive ? "#88DDBB" : "#DD8888",
        borderRadius: "100%",
        width: "20px",
        height: "20px",
        marginRight: "5px",
        cursor: "pointer",
        display: "inline-block",
    }}>
        <div style={{
            color: "white",
            textAlign: "center",
            paddingTop: "2px",
            fontSize: "12px"
        }} onClick={() => rate(is_selected ? undefined : is_positive)}>
            {is_positive ? "+" : "-"}
        </div>
    </div>
}

const RateMessage = ({ message_index, chat_id }: { message_index: number, chat_id: string }) => {

    const [rating, rate] = React.useState<undefined | boolean>(undefined);
    const [old_rating, set_old_rating] = React.useState<undefined | boolean>(undefined);

    React.useEffect(() => {
        if (rating == old_rating) {
            return;
        }
        if (old_rating != undefined || rating != undefined) {
            mongo_delete(COLLECTION.MESSAGE_RATING, { message_index, chat: chat_id })
                .catch(display_error);
        }
        if (rating != undefined) {
            mongo_post(COLLECTION.MESSAGE_RATING, [{ message_index, chat: chat_id, is_positive: rating }])
                .catch(display_error);
        }

        set_old_rating(rating);
    }, [rating]);

    return <div className='flex text-[12px] px-1 pb-1'>
        <div className='mr-2 text-[#666] italic'>
            Was this message helpful?
        </div>
        <div className="flex inline-block w-[100px] text-right translate-y-[-5px]">
            <ThumbsButton is_selected={rating == true} is_positive={true} rate={rate} />
            <ThumbsButton is_selected={rating == false} is_positive={false} rate={rate} />
        </div >
    </div >
}

const ChatHeader = () => {
    const { is_fullscreen, set_fullscreen, settings } = React.useContext(ChatContext);
    return (
        <div style={{ height: '50px' }}>
            <img src={settings.icon_url} width={"38px"} height={"38px"} style={{ borderRadius: '50%', width: '38px', height: '38px', display: 'inline-block', marginRight: '0.75rem', backgroundColor: settings.icon_color }} />
            <div style={{ verticalAlign: 'top', paddingTop: '7px', fontSize: '18px', display: 'inline-block', color: 'rgba(0,0,0,0.6)' }}>{settings.name}</div>
            {is_fullscreen ? (
                <BsFullscreen className="absolute top-[20px] right-[20px] cursor-pointer" onClick={() => set_fullscreen(false)} />
            ) : (
                <BsArrowsFullscreen className="absolute top-[20px] right-[20px] cursor-pointer" onClick={() => set_fullscreen(true)} />
            )}
        </div>
    );
};

type Message = {
    text: string;
    is_self: boolean;
    is_generated: boolean;
};

function CodeBlock({ code }: { code: string }) {

    function copy() {
        navigator.clipboard.writeText(code);
        display_success("Copied to clipboard")
    }

    return (
        <div className="relative max-w-[100%] pb-0 mb-3">
            <div className="absolute top-[5px] right-[3px] font-bold cursor-pointer text-white">
                <IoIosCopy onClick={copy} />
            </div>
            <pre className="bg-black mb-0 text-white text-[12px] overflow-scroll rounded-md">
                {code}
            </pre>
        </div>
    );
}


function fill_markdown(text: string) {
    const split_text = (text || "").split(/(```[^`]+```)/) || "";
    const elements = [] as any[];
    const url_regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    split_text.forEach((part, index) => {
        if (index % 2 === 0) {
            const lines = part.replace(url_regex, '<a class="font-bold" href="$2">$1</a>').split("\n").map((line, index) => {
                if (index == 0) {
                    return line;
                }
                return `<div class='mt-4'>${line}</div>`
            }).join("");
            elements.push(<p className='' dangerouslySetInnerHTML={{ __html: lines }}></p>);
        } else {
            const [_, content] = part.match(/```([^`]+)```/)!;
            elements.push(<CodeBlock code={content} />);
        }
    });
    return <div>
        {
            elements.map((element, index) =>
                <div key={index} className=''>
                    {element}
                </div>)
        }
    </div>
}

function post_process(post_process_code: string, text: string) {
    if (post_process_code?.trim().length > 0) {
        try {
            const func = new Function('text', post_process_code);
            const result = func(text);
            return result;
        } catch (error: any) {
            console.log(error)
            return error.toString();
        }
    } else {
        return text;
    }
}


const ChatInput = ({ add_message }: { add_message: (text: string) => void, }) => {
    const { simulate, is_simulating } = React.useContext(ChatContext);

    function submit_message() {
        const input_element = document.getElementById('chat_input') as HTMLInputElement;
        const value = input_element.value.trim();
        input_element.value = '';
        if (value.length > 0) {
            add_message(value);
        }
    }

    function on_key_down(e: any) {
        if (e.key === 'Enter') {
            submit_message();
        }
    }

    return (
        <div>
            <Button className='mb-3' disabled={is_simulating} shadow onClick={() => simulate()}><BsRobot className='inline-block mr-1' /> simulate</Button>
            <input
                id="chat_input"
                onKeyDown={on_key_down}
                type="text"
                style={{
                    border: '1px solid #CCC',
                    borderRadius: '5px',
                    padding: '15px 55px 15px 15px',
                    width: '100%',
                    backgroundColor: '#FFF',
                    color: '#000'
                }}
            />
            <img src="https://legalbot.qame.org/paperplane.svg" width="40px" height="40px"
                onClick={submit_message}
                style={{
                    position: 'absolute',
                    right: '1rem',
                    bottom: '0.8rem',
                    fontSize: '20px',
                    cursor: 'pointer'
                }} />
        </div>
    );
};

const ChatToggle = ({ set_is_open, is_open }: { set_is_open: (value: boolean) => void, is_open: boolean }) => {
    const { settings, count_unread } = React.useContext(ChatContext);
    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
        }}
        onClick={() => set_is_open(!is_open)}>
            <div
                style={{
                    backgroundColor: settings.icon_color,
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    color: 'white',
                    textAlign: 'center',
                    fontSize: '22px',
                    paddingTop: '5px',
                    cursor: 'pointer',
                    position: 'absolute',
                    right: '0',
                    bottom: '0',
                    overflow: 'hidden',
                    zIndex: 99998
                }}
            >
                <img src={settings.icon_url} style={{
                    width: '40px',
                    height: '40px',
                    margin: 'auto'
                }} />
            </div>

            {
                count_unread > 0
                    ? <div
                        style={{
                            backgroundColor: '#FF0000',
                            borderRadius: '50%',
                            width: '26px',
                            height: '26px',
                            color: 'white',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            position: 'absolute',
                            right: '-10px',
                            border: "3px solid #FFFFFF",
                            bottom: '30px',
                            overflow: 'hidden',
                            zIndex: 99999
                        }}
                    >
                        {count_unread}
                    </div>
                    : null
            }
        </div>
    );

};

function random_string(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i += 1) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const Chat = ({
    salesbot_id,
    is_always_open = false,
    is_never_fullscreen = false,
    on_new_message,
    rect
}: {
    salesbot_id: string;
    is_never_fullscreen?: boolean;
    is_always_open?: boolean;
    on_new_message?: Function;
    rect: any
}) => {
    const [is_responding, set_is_responding] = React.useState(false);
    const [is_simulating, set_is_simulating] = React.useState(false);
    const [is_open, set_is_open] = React.useState(is_always_open);
    const [messages, set_messages] = React.useState<Message[]>([]);
    const [labels, set_labels] = React.useState<(string | undefined)[]>([]);
    const settings = default_value;
    const [is_fullscreen, set_fullscreen] = React.useState(false);
    const [current_message, set_current_message] = React.useState('');
    const [count_unread, set_count_unread] = React.useState(1);

    const [identifier, _] = React.useState(random_string(20));
    const { data: chat } = useGetOrCreate<Chat>(COLLECTION.CHAT, { salesbot: salesbot_id, identifier }, {
        salesbot: salesbot_id,
        memory: {},
        identifier
    }, !is_open)
    const { data: salesbot } = useGet<SalesBot>(COLLECTION.SALESBOT, { _id: salesbot_id }, false, false);
    const chat_id = chat ? chat._id.toString() : undefined;

    function get_settings(field_name: string) {
        const value = (window as any).salesbot ? (window as any).salesbot[field_name] || (default_value.settings as any)[field_name] : (default_value.settings as any)[field_name];
        console.log(field_name, value);
        return value;
    }

    const chat_context = salesbot && settings && {
        settings: {
            ...settings.settings,
            name: get_settings("name"),
            icon_color: get_settings("icon_color"),
            icon_url: get_settings("icon_url"),
            message_color: get_settings("message_color"),
            first_messages: get_settings("first_messages") as { is_bot: boolean, text: string }[],
        },
        is_fullscreen: is_never_fullscreen ? false : is_fullscreen,
        set_fullscreen: is_never_fullscreen ? (value: boolean) => set_fullscreen(false) : set_fullscreen,
        is_simulating,
        is_responding,
        simulate,
        count_unread,
        set_count_unread
    };

    function label_last_message(label: string) {
        const labels_to_add = messages.length - labels.length;
        const new_labels = [...labels, ...Array(labels_to_add).fill(undefined)]
        new_labels[new_labels.length - 1] = label;
        set_labels(new_labels);
    }

    async function fetchAndPrintStream(simulate: boolean) {
        const response = await fetch(process.env.NEXT_PUBLIC_API_PATH + 'chat/' + (simulate ? "simulate" : "respond"), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: simulate ? messages.map(({ text, is_self }) => ({ text, is_self: !is_self })) : messages,
                chat_id
            })
        });

        if (!response.ok) {
            throw new Error(`An error occurred: ${response.statusText}`);
        }

        const stream = response.body;
        const reader = stream!.getReader();

        async function readStream(current_message: string) {
            const { value, done } = await reader.read();

            if (done) {
                set_count_unread(count_unread + 1);
                add_message(current_message, simulate, false);
                set_current_message('');
                return;
            }

            const new_text = new TextDecoder().decode(value);
            if (current_message.length < 40 && labels.length < messages.length && (current_message + new_text).includes("<<<")) {
                const label = (current_message + new_text).split("<<<")[0].trim().toLowerCase();
                label_last_message(label)
                await readStream("");
            } else {
                set_current_message(current_message + new_text);
                await readStream(current_message + new_text);
            }
        }

        await readStream('');
    }

    async function respond() {
        set_is_responding(true);
        await fetchAndPrintStream(false)
            .catch(display_error)
        set_is_responding(false);
    }

    async function simulate() {
        set_is_simulating(true);
        await fetchAndPrintStream(true)
            .catch(display_error);
        set_is_simulating(false);
    }

    function add_message(text: string, is_self: boolean, is_generated: boolean) {
        add_messages([{ text, is_self, is_generated }]);
    }

    function add_messages(new_messages: { text: string, is_self: boolean, is_generated: boolean }[]) {
        set_messages([
            ...messages,
            ...new_messages
        ]);
        scroll_to_bottom_of_chat_history();
    }

    React.useEffect(() => {
        if (messages.length > 0) {
            if (messages[messages.length - 1].is_self && !messages[messages.length - 1].is_generated) {
                respond()
            } else {
                // simulate();
            }
        }
        if (on_new_message) {
            on_new_message();
        }
    }, [messages]);

    React.useEffect(() => {
        if (chat_context && messages.length === 0) {
            add_messages(
                chat_context.settings.first_messages.map(
                    ({ is_bot, text }) => ({ text, is_self: !is_bot, is_generated: true }
                    )
                ));
        }
    }, [chat_context]);

    function scroll_to_bottom_of_chat_history() {
        const chat_history = document.getElementById('chat_history');
        if (chat_history) {
            chat_history.scrollTop = chat_history.scrollHeight;
        }
    }

    const toggle_fullscreen = () => set_fullscreen(!is_fullscreen && !is_never_fullscreen);

    if (!chat_context) {
        return <div></div>
    }

    return (
        <ChatContext.Provider value={chat_context}>
            {is_fullscreen && (is_open || is_always_open) ? (
                <div
                    style={{
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: '5000'
                    }}
                    onClick={toggle_fullscreen}
                ></div>
            ) : null}

            <div style={{ right: '2.5rem' }}>
                {!is_always_open ? <ChatToggle is_open={is_open} set_is_open={set_is_open} /> : null}
            </div>

            {(is_open || is_always_open) && chat_id ? (
                <div
                    className="chatbot"
                    style={{
                        color: 'black',
                        border: '1px solid rgba(0, 0, 0, 0.15)',
                        padding: '0.5rem',
                        backgroundColor: '#FFFFFF',
                        zIndex: 99999,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        borderRadius: '15px',
                        transition: 'all 0.5s ease-in-out',
                        width: is_fullscreen ? 'auto' : '400px',
                        position: 'fixed',
                        top: rect.top,
                        left: rect.left
                    }}
                >
                    <ChatHeader />
                    <ChatHistory post_process_code={salesbot.post_process} chat_id={chat_id} messages={messages} current_message={current_message} labels={labels} />
                    <ChatInput add_message={(text: string) => add_message(text, true, false)} />
                    {
                        chat_id
                            ? null
                            : <div style={{
                                backgroundColor: "rgba(0,0,0,0.7)",
                                borderRadius: "15px",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                position: "absolute",
                                color: "#FFFFFF",
                                textAlign: "center",
                                paddingTop: "300px"
                            }}>
                                Initiating chat, one moment ...
                            </div>
                    }
                </div>
            ) : null}
        </ChatContext.Provider>
    );
};

const ChatHistory = ({ post_process_code, chat_id, messages, current_message, labels }
    : { post_process_code: string, chat_id: string, messages: Message[], current_message: string, labels: (string | undefined)[] }
) => {
    const { is_fullscreen, is_simulating, is_responding, set_count_unread } = React.useContext(ChatContext);

    React.useEffect(() => {
        set_count_unread(0);
    }, [messages])

    return <div
        id="chat_history"
        style={{
            marginBottom: '0.5rem',
            overflowY: 'auto',
            paddingRight: '0.5rem',
            paddingBottom: '70px',
            transition: 'all 0.5s ease-in-out',
            paddingTop: '1.25rem',
            height: is_fullscreen ? 'calc(90vh - 100px)' : '500px'
        }}
    >
        {messages.map(({ text, is_self }, index) => (
            <Message key={index} is_self={is_self} label={labels[index]}>
                {fill_markdown(post_process(post_process_code, text))}
            </Message>
        ))}

        {
            messages.length > 1 && !messages[messages.length - 1].is_self
                ? <RateMessage chat_id={chat_id} message_index={messages.length - 1} />
                : null
        }

        {current_message.length > 0 ? (
            <Message is_self={is_simulating}>{current_message}</Message>
        ) : is_responding ? (
            <p style={{ color: '#666', fontSize: '14px', margin: '0.5rem' }}>writing ...</p>
        ) : null}
    </div>
}

export default Chat;