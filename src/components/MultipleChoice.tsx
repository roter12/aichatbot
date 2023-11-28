import { Radio, RadioGroup } from '@mui/material';
import { useEffect, useState } from 'react';

const MultipleChoice = ({
    selected: selected_initial,
    options,
    keys,
    onSelect,
}: {
    selected: string;
    options: string[];
    keys: string[];
    onSelect: (value: string) => void;
}) => {
    const [selected, set_selected] = useState(selected_initial);

    useEffect(() => {
        onSelect(selected);
    }, [selected]);

    return (
        <div className="block">
            <RadioGroup
                value={selected.startsWith("Other: ") ? "Other" : selected}
                onChange={(e) => {
                    set_selected(e.target.value);
                }}
            >
                {options.map((option, index) => {
                    return (
                        <div key={keys[index]} className='cursor-pointer' onClick={() => {
                            if (selected.startsWith("Other") && option === "Other") {
                                // do nothing
                            } else {
                                set_selected(keys[index])
                            }
                        }}>
                            <Radio value={keys[index]} className='mr-3' />
                            <label>{option}</label>
                            {
                                selected.startsWith("Other") && option === "Other"
                                    ? <input
                                        type="text"
                                        placeholder='Type here...'
                                        className="border rounded-md ml-3 p-2"
                                        value={selected.startsWith("Other: ") ? selected.replaceAll("Other: ", "") : ""}
                                        onChange={e => set_selected(e.target.value.trim().length > 0 ? "Other: " + e.target.value : "Other")} />
                                    : null
                            }
                        </div>
                    );
                })}
            </RadioGroup>
        </div>
    );
};

export default MultipleChoice;
