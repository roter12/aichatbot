import { Dropdown } from '@nextui-org/react';
import { useState } from 'react';

const Select = ({
    selected: selected_initial,
    options,
    keys,
    placeholder,
    onSelect,
}: {
    selected: string;
    options: string[];
    keys: string[];
    placeholder: string;
    onSelect: (value: string) => void;
}) => {
    const [selected, set_selected] = useState(selected_initial);

    return (
        <div className="block">
            <Dropdown>
                <Dropdown.Button color={'primary'} style={{ marginBottom: '10px' }}>
                    {selected.length > 0 ? options[keys.indexOf(selected)] : placeholder}
                </Dropdown.Button>
                <Dropdown.Menu
                    css={{ minWidth: "100px" }}
                    selectedKeys={[selected]}
                    onAction={(key) => {
                        set_selected(key.toString());
                        onSelect(key.toString());
                    }}
                    onChange={(e) => set_selected('>>> ' + JSON.stringify(e.target))}
                    color={'primary'}
                    variant="shadow"
                    aria-label="Actions"
                >
                    {options.map((option, index) => {
                        return <Dropdown.Item css={{ padding: 0 }} key={keys[index]}>{option}</Dropdown.Item>;
                    })}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export default Select;
