import Button from "../Button";
import Textarea from "../Textarea";
import { useState } from "react";
import SimpleWindow from "./SimpleWindow";
import { Plan } from "../Plans";
import { Checkbox } from "@mui/material";
import Link from "next/link";
import VirtualCompanionFlow from "./VirtualCompanionFlow";
import { COLLECTION, mongo_post } from "@/utils/query_api_method";
import { useSession } from "next-auth/react";
import { display_error } from "@/utils/notifications";
import LoadingScreen from "@/components/LoadingScreen";
import ApplicationFlow from "./ApplicationFlow";
import Input from "../Input";
import Dialog from "@/components/Dialog";
import query_api from "@/utils/query_api";
import send_email_from_frontend from "@/utils/send_email_from_frontend";

const TYPE_OPTIONS = [
    "Respond to my own DMs",
    "Outreach & Lead Gen for Professionals",
    "Create a Virtual Companion",
    "Enterprise Auto Response & Lead Gen",
    "Monetize my Audience",
    "Other"
];

const Option = ({ background_url, label, selected, set_selected }:
    { background_url: string, label: string, selected: string | undefined, set_selected: (value: string | undefined) => any }) => {

    const is_selected = selected === label || label === "Other" && selected?.startsWith("Other");
    const [other, set_other] = useState<string>("");

    return <>
        <div onClick={() => set_selected(label)} className={`max-lg: ${is_selected ? "bg-pink-100" : "bg-white"} align-top text-center border p-[10px] font-semibold rounded-md mr-5 mb-5 inline-block cursor-pointer lg:w-[200px] lg:h-[240px] max-lg:w-[160px] max-lg:h-[200px] ${is_selected ? "outline-dashed outline-2 outline-offset-1 outline-pink-500 bg-black/5" : " bg-black/0"}`}>
            <img width="140px" height="140px" src={background_url} className="max-lg:w-[140px] max-lg:h-[140px] lg:w-[180px] lg:h-[180px] rounded-md" />
            <div className="lg:text-[14px] max-lg:text-[12px]">{label === "Other" && selected?.startsWith("Other") ? selected.replaceAll("Other: ", "") : label}</div>
        </div>
        {
            label === "Other"
                ? <Dialog is_open={selected === "Other"} title="What do you want to use your AI for?" close={() => {
                    set_selected(undefined)
                }}>
                    <Input placeholder="Type here..." set_value={set_other} value={other} />
                    <Button onClick={() => {
                        if (other.trim().length > 0) {
                            set_selected("Other: " + other);
                        }
                    }}>Next</Button>
                </Dialog>
                : null
        }
    </>
}

const Options = ({ set_selected, selected, options, backgrounds }
    : { set_selected: (value: string | undefined) => void, selected: string | undefined, options: string[], backgrounds: string[] }) => {

    return <div className="my-5 text-center">
        {
            options.map((option, index) => <Option
                background_url={backgrounds[index]}
                key={index}
                selected={selected}
                set_selected={set_selected}
                label={option} />)
        }
    </div>
}



const TypeOptions = ({ set_selected, selected }: { set_selected: (value: string | undefined) => void, selected: string | undefined }) => {

    const backgrounds = [
        "/bots/social.png",
        "/bots/marketer.png",
        "/bots/companion.png",
        "/bots/business.png",
        "/bots/monetization.png",
        "/bots/other.png"
    ]

    return <Options set_selected={set_selected} selected={selected} options={TYPE_OPTIONS} backgrounds={backgrounds} />
}

const VirtualCompanionOptions = ({ set_selected, selected }: { set_selected: (value: string | undefined) => void, selected: string | undefined }) => {

    const options = [
        "Romantic",
        "Friendship",
        "Therapeutic",
        "Other"
    ];
    const backgrounds = [
        "/bots/companion/romantic.png",
        "/bots/companion/friendly.png",
        "/bots/companion/therapist.png",
        "/bots/other.png",
    ]

    return <div className="w-[500px] mx-auto">
        <Options set_selected={set_selected} selected={selected} options={options} backgrounds={backgrounds} />
    </div>
}

declare type Step = "type" | "companion_type" | "companion_details" | "plans" | "application_details" | "application_received";

const TelegramWindow = ({ on_next }: { on_next: Function }) => {

    const [use, set_use] = useState<string | undefined>(undefined);
    const [purpose, set_purpose] = useState<string | undefined>(undefined);
    const [step, set_step] = useState<Step>("type");
    const [plan, set_plan] = useState(0);
    const [agree, set_agree] = useState(false);
    const [data, set_data] = useState<any>({});
    const { data: session } = useSession();
    const [is_loading, set_loading] = useState(false);

    const titles = {
        "type": "What do you want to use your AI for?",
        "companion_type": "What type of virtual companion do you want?",
        "companion_details": "",
        "plans": "Choose a plan",
        "application_details": "",
        "application_received": "Application received"
    } as any;

    function on_virtual_companion_setup_complete(data: any) {
        set_data({ ...data, purpose });
        set_step("plans");
    }

    async function on_application_setup_complete(application_data: any) {
        set_loading(true);


        const chatbot_setup = {
            config: { ...data, ...application_data },
            email: session?.user?.email
        }

        await send_email_from_frontend(`New application received from ${session?.user?.email} \n\n ${JSON.stringify(chatbot_setup, null, 2)}`);
        // await mongo_post(COLLECTION.CHATBOT_SETUP, [chatbot_setup])
        //     .catch(() => display_error("Error saving chatbot setup"))
        //     .then(() => set_step("application_received"))
        //     .finally(() => set_loading(false));
        set_step("application_received");
    }

    if (step === "companion_details") {
        return <VirtualCompanionFlow on_next={on_virtual_companion_setup_complete} on_back={() => set_step("companion_type")} />
    }

    if (step === "application_details") {
        return <>
            <ApplicationFlow on_next={on_application_setup_complete} on_back={() => set_step("type")} />
            <LoadingScreen show={is_loading} />
        </>
    }

    return <>

        <SimpleWindow title={titles[step]}>
            {
                step === "type"
                    ? <TypeOptions set_selected={set_use} selected={use} />
                    : null
            }
            {
                step === "companion_type" ? <VirtualCompanionOptions set_selected={set_purpose} selected={purpose} /> : null
            }
            {
                step === "plans"
                    ? <>
                        <div className="text-center my-5 ">
                            <Plan className={(plan === 1 ? "outline-dashed outline-2 outline-offset-2 outline-pink-500" : "") + " mx-2 my-2"} button_label="Subscribe" onClick={() => set_plan(1)} name="Text Bot" price={49.9} features={["1 Telegram Bot", "300 Text Messages", "Then $0.10 per message", "Long-term Memory", "See all chats"]} />
                            <Plan className={plan === 2 ? "outline-dashed outline-2 outline-offset-2 outline-pink-500" : ""} button_label="Subscribe" onClick={() => set_plan(2)} name="Voice Bot" price={99.9} features={["1 Telegram Bot", "300 Voice Messages", "Then $0.20 per message", "Long-term Memory", "See all chats"]} />
                        </div>
                        <div className="text-black/50 text-[14px]">

                            <Checkbox className="mr-2 translate-y-[-2px]" checked={agree} onChange={() => set_agree(agree => !agree)} />
                            I agree to the <Link className="text-black/50 underline" href="/terms">Terms of Service</Link>
                        </div>
                    </>
                    : null
            }
            {
                step === "application_received"
                    ? <div className="text-center my-20">
                        <div className="text-2xl font-semibold mb-5">Thank you for your application! ✅</div>
                        <div className="text-black/50 text-[14px] mt-3">
                            We are reviewing your application and will reach out shortly! You will receive email notification when we are ready to build your AI.
                        </div>
                    </div>
                    : null
            }

            {
                step !== "application_received"
                    ? <div className="text-right">
                        {step != "type" ? <Button color="white" onClick={() => {
                            switch (step as Step) {
                            case "companion_type":
                                set_step("type");
                                break;
                            case "companion_details":
                                set_step("companion_type");
                                break;
                            case "plans":
                                set_step("companion_details");
                                break;
                            case "application_details":
                                set_step("type");
                                break;
                            case "application_received":
                                set_step("application_details");
                                break;
                            }
                        }}>Back</Button> : null}
                        <Button disabled={use === undefined || (step === "companion_type" && purpose === undefined) || (step === "plans" && (!agree || plan === 0))} className="ml-2" onClick={async () => {
                            switch (step as Step) {
                            case "type":
                                if (use === TYPE_OPTIONS[2]) {
                                    set_step("companion_type");
                                } else {
                                    set_step("application_details");
                                }
                                break;
                            case "companion_type":
                                set_step("companion_details");
                                break;
                            case "companion_details":
                                set_step("plans");
                                break;
                            case "plans":
                                on_next({ ...data, plan });
                                break;
                            }
                        }}>Next</Button>
                    </div>
                    : null
            }
        </SimpleWindow>
    </>
}

export default TelegramWindow;