import { Slider } from "@mui/material";

const SliderInput = ({ label, value, set_value, min_value = 1, max_value = 10 }: {
    label: string,
    value: number,
    min_value?: number,
    max_value?: number,
    set_value: (value: number) => void
}) => {

    return <>
        <div>{label}</div>
        <Slider aria-label="Volume" value={value} onChange={(e, new_value) => set_value(new_value as number)} min={min_value} max={max_value} />
        <div className="mt-[-10px] float-left">1</div>
        <div className="mt-[-10px] float-right">10</div>
        <div className="h-[50px]"></div>
    </>
}

export default SliderInput;