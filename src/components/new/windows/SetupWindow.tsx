import { useState } from "react";
import StepsWindow from "./StepsWindow";
import Button from "../Button";
import { Slider } from "@mui/material"
import Textarea from "../Textarea";
import YesNoSelect from "../YesNoSelect";

const SetupWindow = ({ on_back, on_next }: { on_back: Function, on_next: Function }) => {

    const [trigger, set_trigger] = useState("");
    const [is_audio, set_is_audio] = useState(false);
    const [response_speed, set_response_speed] = useState(30);

    const data = {
        trigger,
        is_audio,
        response_speed
    };

    return <StepsWindow title="Let's get your AI some basic information" step={1}>
        <div>What should people say to trigger your AI to take over?.</div>
        <Textarea value={trigger} set_value={set_trigger} />
        <div>Do you want your AI to listen to and respond with audio messages?</div>
        <YesNoSelect value={is_audio} set_value={set_is_audio} />
        <div>How fast do you reply on average?</div>
        <Slider aria-label="Volume" value={response_speed} onChange={(e, new_value) => set_response_speed(new_value as number)} min={1} max={90} />
        <div className="float-left">1 minute</div>
        <div className="float-right">90 minutes</div>
        <div className="h-[50px]"></div>
        <div className="text-right">
            <Button color="white" onClick={on_back}>Back</Button>
            <Button className="ml-2" onClick={() => on_next(data)}>Next</Button>
        </div>
    </StepsWindow>
}

export default SetupWindow;