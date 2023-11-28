import { useState } from "react";
import StepsWindow from "./StepsWindow";
import Button from "../Button";
import Textarea from "../Textarea";
import Input from "../Input";

const ClosingWindow = ({ on_back, on_next }: { on_back: Function, on_next: Function }) => {

    const [paragraph, set_paragraph] = useState("");
    const [url, set_url] = useState("");

    const data = {
        paragraph,
        url
    };

    return <StepsWindow title="Okay, closing the deal. Explain to your AI how you know when a prospect is ready to close, are there any keywords that stand out?" step={6}>
        <div>Paragraph</div>
        <Textarea value={paragraph} set_value={set_paragraph} />
        <div>What URL should the AI send to close the deal?</div>
        <Input placeholder="url field" value={url} set_value={set_url} />
        <div className="text-right">
            <Button color="white" onClick={on_back}>Back</Button>
            <Button className="ml-2" onClick={() => on_next(data)}>Confirm</Button>
        </div>
    </StepsWindow>
}

export default ClosingWindow;