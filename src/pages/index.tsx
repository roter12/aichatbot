import GradientBackground from "@/components/new/GradientBackground"
import ClosingWindow from "@/components/new/windows/ClosingWindow"
import CompleteWindow from "@/components/new/windows/CompleteWindow"
import DescriptionWindow from "@/components/new/windows/DescriptionWindow"
import InstagramWindow from "@/components/new/windows/InstagramWindow"
import LoginWindow from "@/components/new/windows/LoginWindow"
import PaymentWindow from "@/components/new/windows/PaymentWindow"
import PersonalityWindow from "@/components/new/windows/PersonalityWindow"
import SetupWindow from "@/components/new/windows/SetupWindow"
import { display_success } from "@/utils/notifications"
import { COLLECTION, mongo_get, mongo_post } from "@/utils/query_api_method"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { ChatbotSetup } from "../api/[collection]/schemas"
import { useSession } from "next-auth/react"

const Page = () => {

    const { data: session, status } = useSession();
    const [step, set_step] = useState(0);
    const [data, set_data] = useState<any>({});
    const [is_setup_complete, set_is_setup_complete] = useState(false);
    const router = useRouter();

    const email = session?.user?.email;

    useEffect(() => {
        if (email && step === 0 && router.query.step) {
            mongo_get(COLLECTION.CHATBOT_SETUP, { email }, { multiple: true, limit: 1, sort: { created: -1 } })
                .then((chatbot_setups: ChatbotSetup[]) => {
                    const chatbot_setup = chatbot_setups[0];
                    set_data(chatbot_setup.config);
                    set_step(parseInt(router.query.step as string));
                })
        }
        if (step === 0 && !router.query.step && status === "authenticated") {
            set_step(1);
        }
    }, [router.query.step, email])

    function on_back() {
        set_step(step - 1);
    }

    function on_next(new_data: any) {
        set_step(step + 1);
        set_data((data: any) => ({ ...data, ...new_data }));
    }

    useEffect(() => {
        if (step === 7 || step === 2) {
            mongo_post(COLLECTION.CHATBOT_SETUP, [{
                config: data,
                email
            }]).then(() => {
                if (step === 7) {
                    display_success("Setup complete!");
                    set_is_setup_complete(true);
                }
            });
        }
    }, [step]);

    return <>
        <GradientBackground />
        {status === "unauthenticated" ? <LoginWindow on_signin={on_next} /> : null}
        {step === 1 ? <SetupWindow on_back={on_back} on_next={on_next} /> : null}
        {step === 2 ? <PaymentWindow on_back={on_back} /> : null}
        {step === 3 ? <InstagramWindow on_back={on_back} on_next={on_next} /> : null}
        {step === 4 ? <DescriptionWindow on_back={on_back} on_next={on_next} /> : null}
        {step === 5 ? <PersonalityWindow on_back={on_back} on_next={on_next} /> : null}
        {step === 6 ? <ClosingWindow on_back={on_back} on_next={on_next} /> : null}
        {step === 7 ? <CompleteWindow is_complete={is_setup_complete} /> : null}
    </>
}

export default Page