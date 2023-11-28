import Button from "../Button";
import { useState } from "react";
import ProgressWindow from "./ProgressWindow";
import YesNoSelect from "../YesNoSelect";
import SliderInput from "../SliderInput";

const GeneralWindow = ({ on_back, on_next, percentage }: { on_back: Function, on_next: Function, percentage: number }) => {

    const [is_vip, set_is_vip] = useState(false);
    const [is_nsfw, set_is_nsfw] = useState(false);
    const [price, set_price] = useState(0);

    const data = {
        is_vip,
        is_nsfw
    };

    return <ProgressWindow title=" Great, now let&apos;s train your AI with some data about you. This is just a start, so don&apos;t think too hard about it, just surface-level stuff." percentage={percentage}>

        <div>Do you want to add a VIP channel?</div>
        <YesNoSelect value={is_vip} set_value={set_is_vip} />

        <div>Is this bot clearly non-explicit (clean content)</div>
        <YesNoSelect value={is_nsfw} set_value={set_is_nsfw} />

        <SliderInput label="Price/minute" value={price} set_value={set_price} />

        <div className="text-right">
            <Button color="white" onClick={on_back}>Back</Button>
            <Button className="ml-2" onClick={() => on_next(data)}>Next</Button>
        </div>
    </ProgressWindow>
}

export default GeneralWindow;