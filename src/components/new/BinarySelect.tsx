
import { Grid, Radio, RadioGroup } from "@mui/material"
import { InnerBox } from "./Box";

const BinarySelect = ({ value_a, value_b, label_a, label_b, value, set_value }: {
    value: boolean,
    value_a: any,
    value_b: any,
    label_a: string,
    label_b: string,
    set_value: (value: any) => void
}) => {
    return <div className="my-3">
        <RadioGroup value={value}>
            <Grid container spacing={4}>
                <Grid item xs={6}>
                    <InnerBox className='font-semibold'>
                        <div className="my-[-10px]">
                            <Radio value={value_a} onChange={e => set_value(e.target.value)} />
                            {label_a}
                        </div>
                    </InnerBox>
                </Grid>
                <Grid item xs={6}>
                    <InnerBox className='font-semibold'>
                        <div className="my-[-10px]">
                            <Radio value={value_b} onChange={e => set_value(e.target.value)} />
                            {label_b}
                        </div>
                    </InnerBox>
                </Grid>
            </Grid>
        </RadioGroup>
    </div >
}

export default BinarySelect;