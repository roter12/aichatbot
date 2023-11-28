import { Button, Card, Loading } from "@nextui-org/react";
import { FaPlus } from "react-icons/fa";
import { COLLECTION, mongo_post } from "../../utils/query_api_method";
import useGet from "../../utils/hooks/useGet";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BotAccess, SalesBot } from "../api/[collection]/schemas";
import { signIn, useSession } from "next-auth/react";
import AuthGuard from "@/components/AuthGuard";
import GradientBackground from "@/components/new/GradientBackground";

export default function Page() {

    const { data: session } = useSession();
    const { data: accesses, reload, is_loading: is_fetching_access } = useGet<BotAccess[]>(COLLECTION.BOT_ACCESS, { email: session?.user?.email }, true, !session);
    const { data: salesbots, reload: reload_salesbot, is_loading: is_fetching_salesbots } =
        useGet<SalesBot[]>(COLLECTION.SALESBOT, {
            _id: {
                $in: accesses?.map(({ salesbot }) => salesbot)

            }
        }, true, !accesses);
    const [is_loading, set_is_loading] = useState(false);

    useEffect(() => {
        if (accesses) {
            reload_salesbot();
        }
    }, [accesses])

    const is_fetching = is_fetching_access || is_fetching_salesbots

    async function create_bot() {
        set_is_loading(true);
        const name = prompt("What should your bot be called?")
        try {
            const salesbot_id = await mongo_post(COLLECTION.SALESBOT, [{ name: "", settings: { name } }]).then(result => result[0])
            await mongo_post(COLLECTION.BOT_ACCESS, [{ email: session?.user?.email, salesbot: salesbot_id }])
            reload();
        } finally {
            set_is_loading(false);
        }
    }

    return <div className="p-10">

        <GradientBackground />
        <div className="fixed">

            {
                is_fetching
                    ? <Loading />
                    : salesbots?.map((salesbot: SalesBot) => <Link href={"/admin/bot/" + salesbot._id} key={salesbot._id.toString()}>
                        <Card isHoverable variant="bordered" css={{ mw: "250px", display: "inline-block", margin: "5px" }}>
                            <Card.Body>
                                {salesbot.settings.name || salesbot._id.toString()}
                            </Card.Body>
                        </Card>
                    </Link>)
            }
        </div>
        {/* <Button color="success" disabled={is_loading} onClick={create_bot}>
            {is_loading ? <Loading /> : <FaPlus className="inline-block mr-1" />}
            Create Bot
        </Button> */}

    </div>
}