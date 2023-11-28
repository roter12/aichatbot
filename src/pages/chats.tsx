import Dialog from "@/components/Dialog";
import { display_error } from "@/utils/notifications";
import query_api from "@/utils/query_api";
import { Button, Loading } from "@nextui-org/react";
import { useEffect, useState } from "react";

const ViewChatButton = ({ salesbot_id, telegram_chat_id }: { salesbot_id: string, telegram_chat_id: string }) => {
    const [is_open, set_is_open] = useState(false);
    const [messages, set_messages] = useState<{ is_bot: boolean, text: string }[] | undefined>(undefined);

    useEffect(() => {
        if (is_open) {
            query_api("analyze", { salesbot_id, telegram_chat_id })
                .then(set_messages)
                .catch(error => {
                    console.log(error);
                    display_error(error);
                })
        }
    }, [is_open]);

    return <div>
        <Button onClick={() => set_is_open(true)}>View Chat</Button>
        <Dialog title="Chat History" is_open={is_open} close={() => set_is_open(false)}>
            <div className="max-w-[80vw] mt-[100px] mx-auto">
                {
                    messages
                        ? messages!.map((message, index) =>
                            <div className="my-2" key={index}>
                                <div className="inline-block w-[200px]">{message.is_bot ? "Bot" : "User:"}</div>
                                <div className="inline-block w-[200px]">{message.text}</div>
                            </div>
                        )
                        : <Loading />
                }
            </div>
        </Dialog>
    </div>
}

const MassDMButton = () => {

    const [message, set_message] = useState("");
    const [delay, set_delay] = useState(10);
    const [offset, set_offset] = useState(0);
    const [limit, set_limit] = useState(10);

    async function send() {
        await query_api("mass_dm", {
            salesbot_id: "64c3c71b0338812081391c5e",
            message,
            delay: delay,
            offset: offset,
            limit: limit
        })
    }

    return <div className="border mb-10 rounded-xl p-10">
        <div className="text-[30px] mb-5 font-bold">Mass DM</div>
        <div>
            <div className="w-[200px] inline-block">Delay (seconds):</div>
            <input type="number" value={delay} onChange={e => set_delay(parseInt(e.target.value))} placeholder="Delay" className="border rounded-lg px-2 py-1" />
        </div>
        <div>
            <div className="w-[200px] inline-block">Offset:</div>
            <input type="number" value={offset} onChange={e => set_offset(parseInt(e.target.value))} placeholder="Offset" className="border rounded-lg px-2 py-1" />
        </div>
        <div>
            <div className="w-[200px] inline-block">Limit:</div>
            <input type="number" value={limit} onChange={e => set_limit(parseInt(e.target.value))} placeholder="Limit" className="border rounded-lg px-2 py-1" />
        </div>
        <div>
            <div className="w-[200px] inline-block">Message:</div>
            <input type="text" value={message} onChange={e => set_message(e.target.value)} placeholder="Message" className="w-[400px] border rounded-lg px-2 py-1" />
        </div>
        <Button onClick={send}>Send</Button>
    </div>
}

const Chat = ({ username, telegram_chat_id }: { username: string, telegram_chat_id: number }) => {
    const [is_responding, set_is_responding] = useState(false);
    async function respond(telegram_chat_id: number) {
        set_is_responding(true);
        await query_api("reminder", {
            salesbot_id: "64c3c71b0338812081391c5e",
            telegram_chat_id: telegram_chat_id
        })
        set_is_responding(false);
    }
    return <div className="my-2">
        <div className="inline-block w-[200px]">{username}</div>
        <div className="inline-block w-[200px]">{telegram_chat_id}</div>
        <div className="inline-block w-[200px]">
            <Button onClick={() => respond(telegram_chat_id)} disabled={is_responding}>
                {is_responding ? <Loading /> : "Respond"}
            </Button>
        </div>
        <div className="inline-block w-[200px]">
            <ViewChatButton salesbot_id="64c3c71b0338812081391c5e" telegram_chat_id={telegram_chat_id.toString()} />
        </div>
    </div>
}

export default function Page() {
    const [chats, set_chats] = useState<{ telegram_chat_id: number, username: string }[]>([]);

    useEffect(() => {
        query_api("chats")
            .then(set_chats)
            .catch(error => {
                console.log(error);
                display_error(error);
            })
    }, []);


    return <div className="max-w-[80vw] mt-[100px] mx-auto">
        <MassDMButton />
        {
            chats.map((chat) =>
                <Chat key={chat.telegram_chat_id} {...chat} />
            )
        }
    </div>
}