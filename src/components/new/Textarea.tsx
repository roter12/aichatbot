
const Textarea = ({ value, set_value, placeholder, onBlur, style }: {
    onBlur?: () => void,
    value: string,
    set_value: (value: string) => void,
    placeholder?: string,
    style?: any
}) => {
    return <div className="my-[10px]">
        <textarea
            value={value}
            style={style}
            onBlur={onBlur}
            onChange={e => set_value(e.target.value)}
            className="w-full h-[100px] bg-[#FBFCFE] border rounded-[15px] p-5 text-[14px]"
            placeholder={placeholder}></textarea>
    </div>
}

export default Textarea;