
import { Grid, Radio, RadioGroup, Slider } from "@mui/material"
import { FaMicrophone } from "react-icons/fa";
import { InnerBox } from "./Box";

const YesNoSelect = ({ value, set_value }: {
    value: boolean,
    set_value: (value: boolean) => void
}) => {
    return <div className="my-3">
        <RadioGroup value={value ? "yes" : "no"}>
            <Grid container spacing={4}>
                <Grid item xs={6}>
                    <InnerBox className='font-semibold'>
                        <div className="my-[-10px]">
                            <Radio value="yes" onChange={e => set_value(e.target.value === "yes")} />
                            Yes
                            <div className='bg-[#FFEEEE] text-[#FF8888] rounded-lg float-right w-[30px] h-[30px] pt-[7px] cursor-pointer inline-block align-top translate-y-[5px]'>
                                <FaMicrophone className="mx-auto" />
                            </div>
                        </div>
                    </InnerBox>
                </Grid>
                <Grid item xs={6}>
                    <InnerBox className='font-semibold'>
                        <div className="my-[-10px]">
                            <Radio value="no" onChange={e => set_value(e.target.value === "yes")} />
                            No
                        </div>
                    </InnerBox>
                </Grid>
            </Grid>
        </RadioGroup>
    </div >
}

export default YesNoSelect;