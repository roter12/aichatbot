import StepsWindow from "./StepsWindow";
import Button from "../Button";
import Textarea from "../Textarea";
import { useState } from "react";
import Input from "../Input";

const DescriptionWindow = ({ on_back, on_next }: { on_back: Function, on_next: Function }) => {

    const [description, set_description] = useState("");
    const [story, set_story] = useState("");
    const [website, set_website] = useState("");

    const data = {
        description,
        story,
        website
    };

    return <StepsWindow title=" Great, now let&apos;s train your AI with some data about you. This is just a start, so don&apos;t think too hard about it, just surface-level stuff." step={4}>

        <div>Tell the AI a little about what you sell and why you&apos;re passionate about it.</div>
        <Textarea value={description} set_value={set_description} />
        <div>What&apos;s your story? Why did you start this business?</div>
        <Textarea value={story} set_value={set_story} />
        <div>What&apos;s your website url?</div>
        <Input placeholder="https://" value={website} set_value={set_website} />

        <div className="text-right">
            <Button color="white" onClick={on_back}>Back</Button>
            <Button className="ml-2" onClick={() => on_next(data)}>Next</Button>
        </div>
    </StepsWindow>
}

export default DescriptionWindow;