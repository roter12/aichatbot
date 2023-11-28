import useGet from "@/utils/hooks/useGet"
import query_api from "@/utils/query_api"
import { COLLECTION } from "@/utils/query_api_method"
import { Loading } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { Payment } from "./api/[collection]/schemas"
import { FaCheckCircle } from "react-icons/fa"

const format_currency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat(
        "en-US",
        { style: "currency", currency }
    ).format(amount / 100)
}

const unix_to_string = (unix: number) => {
    const seconds_ago = Math.floor((Date.now() - unix * 1000) / 1000);
    const minutes_ago = Math.floor(seconds_ago / 60);
    const hours_ago = Math.floor(minutes_ago / 60);
    const days_ago = Math.floor(hours_ago / 24);

    let amount = 0;
    let unit = "";

    if (days_ago > 0) {
        amount = days_ago;
        unit = "day(s)";
    } else if (hours_ago > 0) {
        amount = hours_ago;
        unit = "hour(s)";
    } else if (minutes_ago > 0) {
        amount = minutes_ago;
        unit = "minute(s)";
    } else {
        amount = seconds_ago;
        unit = "second(s)";
    }

    return new Date(unix * 1000).toLocaleString() + ` (${amount} ${unit} ago)`
}

function random_color(seed: string) {
    var hash = 0;
    for (var i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

function use_white_text(hex: string) {
    const r = parseInt(hex.substr(1, 2), 16)
    const g = parseInt(hex.substr(3, 2), 16)
    const b = parseInt(hex.substr(5, 2), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return yiq < 128
}

const Payment = ({ id, amount, created, billing_details, payment_intent }
    : { id: string, payment_intent: string, amount: number, created: number, billing_details: { address: { country: string }, email: string, name: string, } }
) => {

    const [session, set_session] = useState<string | undefined>(undefined)


    const { data: payments } = useGet<Payment[]>(COLLECTION.PAYMENT, { stripe_session_id: session }, true, session === undefined);

    useEffect(() => {
        query_api("stripe_session", { payment_intent })
            .then(set_session)
    }, [])

    const { address, email, name } = billing_details
    const first_name = name.toLowerCase().split(" ")[0];
    const color = random_color(first_name);

    return <div className="m-5 p-5 shadow-md rounded-md w-[500px]" style={{ backgroundColor: color, color: use_white_text(color) ? "#FFFFFF" : "#000000" }}>
        <div className="text-[10px]">{id} - {unix_to_string(created)}</div>
        <div className="text-[10px]">{session}</div>
        <div>
            {name} ({address.country})</div>
        <div>{email}</div>
        <div className="p-3">
            {payments?.map(({ reference, is_paid, _id }) => <div key={"payment_" + _id}>{reference} {is_paid ? <FaCheckCircle className="inline-block" /> : null}</div>)}
        </div>
        <div className="font-bold text-[20px]">{format_currency(amount, "GBP")}</div>
    </div>
}

const Page = () => {

    const [payments, set_payments] = useState<any[] | undefined>(undefined);

    const paid_payments = payments?.filter(payment => payment.paid)

    const total_earned = paid_payments?.reduce((acc, payment) => acc + payment.amount, 0)

    useEffect(() => {
        query_api("stripe_payments")
            .then(set_payments)
    }, [])

    return <div className="max-w-[80vw] mt-[100px] mx-auto">
        <h1>Payments</h1>
        <p>Total earned: {format_currency(total_earned, "GBP")}</p>
        {
            paid_payments
                ? paid_payments!.map((payment) => <Payment key={payment.id} {...payment} />)
                : <Loading />
        }
    </div>
}

export default Page;