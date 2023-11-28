import { RxCross2 } from "react-icons/rx";
import { InnerBox } from "../Box";
import StepsWindow from "./StepsWindow";
import Button from "../Button";

const InstagramWindow = ({ on_back, on_next }: { on_back: Function, on_next: Function }) => {

    const accounts = ["Murad hossain"];

    return <StepsWindow title="Connect your Instagram Account" step={3}>
        <InnerBox className='font-semibold mb-3 relative cursor-pointer text-center'>
            Connect Instagram
        </InnerBox>
        <div className="mt-10 font-semibold text-[#5B7AA3]">CONNECTED ACCOUNTS</div>

        {
            accounts.map((account, index) => <InstagramAccount key={"account_" + index} name={account} />)
        }

        <div className="text-right">
            <Button color="white" onClick={on_back}>Back</Button>
            <Button className="ml-2" onClick={on_next}>Next</Button>
        </div>
    </StepsWindow>
}

const InstagramAccount = ({ name }: { name: string }) => {
    return <div className="my-5">
        <div className="bg-black rounded-full w-[40px] h-[40px] inline-block"></div>
        <div className="font-semibold inline-block align-top pt-[8px] ml-3">{name}</div>
        <div className="bg-black/5 rounded-full w-[30px] h-[30px] mt-[5px] inline-block align-top float-right text-[22px] text-black/50 cursor-pointer">
            <RxCross2 className="mx-auto mt-[5px]" />
        </div>
    </div>
}

export default InstagramWindow;