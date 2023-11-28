import Button from "../Button";
import { useEffect, useState } from "react";
import { Checkbox } from "@mui/material";
import QUESTIONS from "./questions.json";
import ProgressWindow from "./ProgressWindow";
import { VoiceSelector } from "@/pages/bot/[id]";
import Question from "../Question";
import useStoredState from "@/utils/hooks/useStoredState";

const VoiceSelection = ({
    set_voice
}: {
    set_voice: Function
}) => {

    const [is_voice_enabled, set_is_voice_enabled] = useState(true);
    const [selected_voice, set_selected_voice] = useState<any>(null);

    useEffect(() => {
        set_voice(selected_voice);
    }, [selected_voice]);

    return <div>
        {/* <div className="flex items-center">
            <Checkbox checked={is_voice_enabled} onChange={e => set_is_voice_enabled(e.target.checked)} />
            <div className="text-sm">Enable voice</div>
        </div> */}
        {
            is_voice_enabled
                ? <VoiceSelector
                    salesbot_id="64cf2c9834e8167515cfd3e5"
                    selected_voice={selected_voice}
                    set_selected_voice={set_selected_voice} />
                : null
        }
    </div>
}


const VirtualCompanionFlow = ({ on_next, on_back }: { on_next: Function, on_back: Function }) => {

    const [data, set_data, was_stored] = useStoredState<any>("virtual_companion_data", {});
    const [step, set_step] = useStoredState<number>("virtual_companion_step", 0);

    function set_data_field(field: string, value: any) {
        set_data((data: any) => ({ ...data, [field]: value }));
    }

    useEffect(() => {
        if (was_stored && JSON.stringify(data) !== "{}") {
            const wants_to_use_stored_data = confirm("Do you want to continue where you left off?");
            if (!wants_to_use_stored_data) {
                set_data({});
                set_step(0);
            }
        }
    }, [was_stored]);

    const titles = QUESTIONS.map(question => question.question).concat(["Select a voice"]);
    const question = QUESTIONS[step];
    const response = question ? data[question.id] : null;
    const percentage = Math.round(((step + 1) / QUESTIONS.length) * 100);

    const POST_QUESTION_STEP_COUNT = 1;

    const LAST_QUESTION_STEP = QUESTIONS.length - 1;
    const VOICE_SELECTION_STEP = LAST_QUESTION_STEP + 1;
    const LAST_STEP = LAST_QUESTION_STEP + POST_QUESTION_STEP_COUNT;

    return <ProgressWindow percentage={percentage} title={titles[step] || ""}>
        <div className="h-[350px] overflow-y-auto">
            {
                step === VOICE_SELECTION_STEP
                    ? <VoiceSelection set_voice={(value: any) => set_data_field("voice", value)} />
                    : <Question key={question.id} question={question} set_response={(value: any) => set_data_field(question.id, value)} response={response} />

            }
        </div>
        <div className="text-right">
            <Button color="white" onClick={() => step > 0 ? set_step(step => step - 1) : on_back()}>Back</Button>
            <Button disabled={(!response && !question?.skippable && step !== VOICE_SELECTION_STEP) || (response === "Other")} className="ml-2" onClick={() => {
                if (step === LAST_STEP) {
                    on_next(data);
                } else {
                    if (step === LAST_QUESTION_STEP && data.voice_or_text === "Text") {
                        on_next(data);
                    } else {
                        set_step(step + 1);
                    }
                }
            }}>{!response && question?.skippable ? "Skip" : "Next"}</Button>
        </div>
    </ProgressWindow>
}

export default VirtualCompanionFlow;