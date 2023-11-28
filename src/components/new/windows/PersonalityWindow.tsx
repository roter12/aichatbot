import { useState } from "react";
import StepsWindow from "./StepsWindow";
import Button from "../Button";
import { Slider } from "@mui/material"
import SliderInput from "../SliderInput";


const PersonalityWindow = ({ on_back, on_next }: { on_back: Function, on_next: Function }) => {

    const [friendly, set_friendly] = useState(3);
    const [educational, set_educational] = useState(3);
    const [humorous, set_humorous] = useState(3);
    const [empathetic, set_empathetic] = useState(3);

    const data = {
        friendly,
        educational,
        humorous,
        empathetic
    };

    return <StepsWindow title="Okay, now the fun part, let's fine-tune the AI to your personality!" step={5}>
        <SliderInput label="How “friendly” would you say you are in DMs?" value={friendly} set_value={set_friendly} />
        <SliderInput label="How “educational” would you say you are in DMs?" value={educational} set_value={set_educational} />
        <SliderInput label="How “humorous” would you say you are in DMs?" value={humorous} set_value={set_humorous} />
        <SliderInput label="How “empathetic” would you say you are in DMs?" value={empathetic} set_value={set_empathetic} />
        <div className="text-right">
            <Button color="white" onClick={on_back}>Back</Button>
            <Button className="ml-2" onClick={() => on_next(data)}>Next</Button>
        </div>
    </StepsWindow>
}

export default PersonalityWindow;