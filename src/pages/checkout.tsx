import useGet from "@/utils/hooks/useGet"
import Link from "next/link"
import { useRouter } from "next/router"
import { Whitelist } from "./api/[collection]/schemas"
import { COLLECTION } from "@/utils/query_api_method"
import useGetOrCreate from "@/utils/hooks/useGetOrCreate"
import { Loading } from "@nextui-org/react"

const IS_WHITELIST_ENABLED = process.env.IS_WHITELIST_ENABLED === "true";
const prices = process.env.NEXT_PUBLIC_STRIPE_DEPOSIT_PRICES?.split(",").map((price: string) => parseInt(price)) || [];

const Option = ({ price_amount, price_currency_symbol, platform, platform_chat_id }:
    { price_amount: number, price_currency_symbol: string, platform: "telegram" | "instagram", platform_chat_id: string }) => {
    return <Link href={`/api/checkout?product=deposit&platform=${platform}&reference=${platform_chat_id}&amount=` + price_amount}>
        <div className="rounded-xl shadow-xl w-[200px] h-[200px] inline-block m-5 bg-[#0B8] text-white cursor-pointer">
            <div className=" text-center pt-[40px]">
                <div className="text-[50px] mt-[30px] inline-block">{price_currency_symbol}</div>
                <div className="font-bold text-[80px] inline-block">{price_amount}</div>
            </div>
        </div>
    </Link>
}

const Options = ({ platform, platform_chat_id }: { platform: "telegram" | "instagram", platform_chat_id: string }) => {
    return <>
        <h1>Choose Deposit Amount:</h1>
        <div className="mt-[100px]">
            {
                prices.map((price, i) => {
                    return <Option key={i} price_currency_symbol={"£"} price_amount={price} platform={platform} platform_chat_id={platform_chat_id} />
                })
            }
        </div>
    </>
}

const Waitlist = () => {
    return <div className="mt-[100px]">
        <h1>You are on the Waitlist ⏳</h1>
        <p>Soon you will get access to Anastasia&apos;s private chat. You will receive a notification in Telegram.</p>
    </div>
}

const Page = () => {

    const router = useRouter();
    const platform = router.query.platform as "telegram" | "instagram" || "telegram";
    const platform_chat_id = router.query.r as string;
    const { data: whitelist_entry, is_finished } = useGetOrCreate<Whitelist>(COLLECTION.WHITELIST,
        { reference: platform_chat_id },
        { reference: platform_chat_id, is_whitelisted: false },
        platform_chat_id === undefined);
    const is_whitelisted = whitelist_entry?.is_whitelisted;

    return <div className="text-center max-w-[1000px mx-auto] py-[100px]">
        {
            is_finished
                ? is_whitelisted || !IS_WHITELIST_ENABLED
                    ? <Options platform={platform} platform_chat_id={platform_chat_id} />
                    : <Waitlist />
                : <Loading />
        }
    </div>
}

export default Page