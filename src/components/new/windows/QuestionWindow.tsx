import Button from "../Button";
import Textarea from "../Textarea";
import { useState } from "react";
import ProgressWindow from "./ProgressWindow";

const QuestionWindow = ({ questions, on_back, on_next, percentage }: { questions: string[], on_back: Function, on_next: Function, percentage: number }) => {

    const [answers, set_answers] = useState(questions.map(() => ""));

    const data = {
        ...answers
    };

    return <ProgressWindow title=" Great, now let&apos;s train your AI with some data about you. This is just a start, so don&apos;t think too hard about it, just surface-level stuff." percentage={percentage}>

        {
            questions.map((question, index) => (<div key={index}>
                <div>{question}</div>
                <Textarea value={answers[index]} set_value={value => set_answers(answers =>
                    answers.map((answer, i) => i === index ? value : answer)
                )} />
            </div>))
        }
        <div className="text-right">
            <Button color="white" onClick={on_back}>Back</Button>
            <Button className="ml-2" onClick={() => on_next(data)}>Next</Button>
        </div>
    </ProgressWindow>
}

export default QuestionWindow;