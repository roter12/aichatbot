import Button from "../Button";
import { useEffect, useState } from "react";
import QUESTIONS from "./questions_application.json";
import ProgressWindow from "./ProgressWindow";
import Question from "../Question";
import useStoredState from "@/utils/hooks/useStoredState";

const ApplicationFlow = ({ on_next, on_back }: { on_next: Function, on_back: Function }) => {

    const [data, set_data, was_stored] = useStoredState<any>("application_data", {});
    const [step, set_step] = useStoredState<number>("application_data_step", 0);

    function set_data_field(field: string, value: any) {
        set_data((data: any) => ({ ...data, [field]: value }));
    }

    useEffect(() => {
        if (was_stored && JSON.stringify(data) !== "{}" && JSON.stringify(data) !== "{\"industry\":\"\"}") {
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

    return <ProgressWindow percentage={percentage} title={titles[step] || ""}>
        <div className="h-[350px] overflow-y-auto">
            <Question key={question.id} question={question} set_response={(value: any) => set_data_field(question.id, value)} response={response} />
        </div>
        <div className="text-right">
            <Button color="white" onClick={() => step > 0 ? set_step(step => step - 1) : on_back()}>Back</Button>
            <Button disabled={(!response && !question?.skippable) || response === "Other"} className="ml-2" onClick={() => {
                if (step === QUESTIONS.length - 1) {
                    on_next(data);
                } else {
                    set_step(step + 1);
                }
            }}>{!response && question?.skippable ? "Skip" : "Next"}</Button>
        </div>
    </ProgressWindow>
}

export default ApplicationFlow;