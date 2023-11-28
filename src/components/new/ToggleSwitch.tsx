
const ToggleSwitch = ({ label_a, label_b, value, set_value, value_a, value_b }: {
    label_a: string,
    label_b: string,
    value_a: any,
    value_b: any,
    value: any | null,
    set_value: Function
}) => {
    const handleSelect = (option: any) => {
        if (value === option) {
            set_value(null);
        } else {
            set_value(option);
        }
    };


    return (
        <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
                type="button"
                className={`w-[200px] px-4 py-2 text-sm font-medium rounded-l-lg ${value === value_a ? 'bg-pink-400 text-white' : 'bg-white text-pink-400 border border-pink-400'
                }`}
                onClick={() => handleSelect(value_a)}
            >
                {label_a}
            </button>
            <button
                type="button"
                className={`w-[200px] px-4 py-2 text-sm font-medium rounded-r-lg ${value === value_b ? 'bg-pink-400 text-white' : 'bg-white text-pink-400 border border-pink-400'
                }`}
                onClick={() => handleSelect(value_b)}
            >
                {label_b}
            </button>
        </div>
    );
};

export default ToggleSwitch;