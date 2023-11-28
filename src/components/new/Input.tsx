
const Input = ({ placeholder, value, set_value, onBlur }: {
    placeholder: string,
    value: string,
    set_value: (value: string) => void,
    onBlur?: (e: any) => any
}) => {
    return <div className="my-[10px]">
        <input
            className="w-full bg-[#FBFCFE] border rounded-[15px] p-5 text-[14px]"
            placeholder={placeholder}
            value={value}
            onChange={e => set_value(e.target.value)}
            onBlur={onBlur}
        />
    </div>
}

export default Input;