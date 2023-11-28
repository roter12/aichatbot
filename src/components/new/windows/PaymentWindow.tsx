import { Radio, RadioGroup } from "@mui/material";
import Button from "../Button";
import StepsWindow from "./StepsWindow";
import { InnerBox } from "../Box";
import { useState } from "react";
import { useRouter } from "next/router";
import pay_with_stripe from "@/utils/pay_with_stripe";
import { StripePrice } from "@/pages/api/[collection]/schemas";
import { COLLECTION, mongo_get } from "@/utils/query_api_method";

const PlanSelect = ({ plan, set_plan }: {
    plan: string,
    set_plan: (plan: string) => void
}) => {
    return <div className="my-3">
        <RadioGroup value={plan}>
            <InnerBox className='font-semibold mb-3 relative'>
                <div className="my-[-10px]">
                    <Radio value="plan1" onChange={e => set_plan(e.target.value)} />
                    Just me
                    <div className="inline-block absolute right-5 top-4">$50/month</div>
                </div>
            </InnerBox>
            <InnerBox className='font-semibold relative'>
                <div className="my-[-10px]">
                    <Radio value="plan2" onChange={e => set_plan(e.target.value)} />
                    Business Opportunity
                    <div className="inline-block absolute right-5 top-4">$150/month</div>
                </div>
            </InnerBox>
        </RadioGroup>
    </div >
}

const PaymentWindow = ({ on_back }: { on_back: Function }) => {

    const [is_monthly, set_is_monthly] = useState(true);
    const [plan, set_plan] = useState("plan1");

    const data = {
        is_monthly,
        plan
    };

    function pay() {
        const identifier = plan === "plan1"
            ? "STRIPE_PRICE_MULTILEVEL_INDIVIDUAL"
            : "STRIPE_PRICE_MULTILEVEL_BUSINESS"
        const callback_url = process.env.NEXT_PUBLIC_API_PATH!.replace("/api", "") + "/new?step=3";
        pay_with_stripe(identifier, callback_url, "653f75d0bbdbf98ee7f3f51a");
    }

    return <StepsWindow title="Payment" step={2}>
        <div>Nice start! Just 4 more steps to finish your bot and save you hours of wasted time a day and thousands of dollars a month. Let&apos;s setup your account.</div>
        <div className="text-center my-5">
            <Button onClick={() => set_is_monthly(true)} color={is_monthly ? "primary" : "white"}>Monthly</Button>
            <Button onClick={() => set_is_monthly(false)} color={is_monthly ? "white" : "primary"}>Yearly</Button>
        </div>
        <PlanSelect set_plan={set_plan} plan={plan} />
        <div className="h-[50px]"></div>
        <div className="text-right">
            <Button color="white" onClick={on_back}>Back</Button>
            <Button className="ml-2" onClick={() => pay()}>Payment with stripe and next</Button>
        </div>

    </StepsWindow>
}

export default PaymentWindow;