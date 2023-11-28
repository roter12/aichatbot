import { Checkbox } from "@mui/material";
import MultipleChoice from "../MultipleChoice";
import Input from "./Input";
import Textarea from "./Textarea";
import ToggleSwitch from "./ToggleSwitch";
import BinarySelect from "./BinarySelect";
import { useState } from "react";
import Button from "./Button";

const Question = ({ question, set_response, response }: {
    question: any,
    set_response: Function,
    response: any
}) => {

    const [other, set_other] = useState<string>("");

    if (question.type === "binary_group") {
        return (
            <>
                {question.questions.map((binaryQuestion: any, index: number) => (
                    <div key={index} className="my-10 text-center">
                        <ToggleSwitch
                            value={response ? response[binaryQuestion.id] : undefined}
                            value_a={binaryQuestion.options[0]}
                            value_b={binaryQuestion.options[1]}
                            label_a={binaryQuestion.options[0]}
                            label_b={binaryQuestion.options[1]}
                            set_value={(value: any) => set_response({ ...response, [binaryQuestion.id]: value })}
                        />
                    </div>
                ))}
            </>
        );
    }
    if (question.type === "number" || question.type === "string") {
        return <Input placeholder={question.placeholder || ""} value={response || ""} set_value={value => set_response(value)} />
    }
    if (question.type === "open_ended") {
        return <Textarea placeholder={question.placeholder || ""}
            value={response || ""}
            set_value={value => set_response(value)} />
    }
    if (question.type === "select") {
        return <MultipleChoice key={question.id} keys={question.options as string[]} options={question.options as string[]} selected={response || ""} onSelect={(value: string) => set_response(value)} />
    }
    if (question.type === "multiple_choice") {
        return <>

            {question.options?.map((option: string, index: number) => {

                if (option === "Other") {
                    return <>
                        {
                            response?.filter((option: string) => !question.options!.includes(option)).map((option: string, index: number) => {
                                return <div key={index} className="w-[300px] inline-block">
                                    <Checkbox checked={true} onChange={e => set_response((response || []).filter((option2: string) => option2 !== option))
                                    } />
                                    <div className="inline-block w-[250px]">
                                        {option}
                                    </div>
                                </div>

                            })}
                        <div className="w-[300px] inline-block">
                            <Input placeholder="Other" value={other} set_value={value => set_other(value)} onBlur={() => {
                                if (other.trim().length > 0) {
                                    set_response([...(response || []), other])
                                    set_other("")
                                }
                            }} />
                        </div>
                    </>
                }

                return <div key={index} className="w-[300px] inline-block">
                    <Checkbox checked={response?.includes(option)} onChange={e => set_response(
                        e.target.checked
                            ? [...(response || []), option]
                            : (response || []).filter((option2: string) => option2 !== option)
                    )
                    } />
                    <div className="inline-block w-[250px]">
                        {option}
                    </div>
                </div>
            })}

        </>
    }
    if (question.type === "binary") {
        return <BinarySelect value={response || undefined} value_a={true} value_b={false} label_a={question.options![0]} label_b={question.options![1]} set_value={(value: boolean) => set_response(value)} />
    }
    return <div>Invalid question</div>
}


export default Question;