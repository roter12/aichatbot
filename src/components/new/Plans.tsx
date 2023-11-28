

export const Plan = ({ onClick, className, name, price, features, button_label, on_button_click }
    : { onClick?: Function, className?: string, name: string, price: number, features: string[], button_label: string, on_button_click?: Function }) => {
    return <div onClick={() => onClick ? onClick() : {}} className={`bg-white rounded-xl border max-lg:w-[260px] lg:w-[300px] h-full inline-block p-5 ${onClick ? "cursor-pointer" : ""} ${className}`}>
        <div className="text-2xl font-semibold ml-2 mb-3 mt-1">{name}</div>
        <div className="text-4xl font-bold ml-2 mt-1">
            ${price.toFixed(2).split(".")[0]}.
            <label className="text-[0.7em]">{price.toFixed(2).split(".")[1]}</label>
            <label className="text-[14px] text-black/50">/mo</label></div>
        <button onClick={() => on_button_click ? on_button_click() : {}} className="bg-black cursor-pointer text-white rounded-md w-full p-1 text-[12px] font-semibold mt-5">{button_label}</button>
        <div className="text-[12px] mb-2 mt-5">What&apos;s included</div>
        <div className="text-[12px] ml-2 mt-1">
            {
                features.map((feature, index) => <div key={index} className="flex items-center my-1">
                    &#10004; {feature}
                </div>)
            }
        </div>
    </div>
}

const Plans = () => {
    return <div className="my-10">
        <Plan className="mr-2" button_label="Upgrade" name="Free" price={0} features={["1 Chatbot", "1 Voice", "1 Personality", "1 Chatbot", "1 Voice", "1 Personality"]} />
        <Plan className="mr-2" button_label="Upgrade" name="Basic" price={10} features={["1 Chatbot", "1 Voice", "1 Personality", "1 Chatbot", "1 Voice", "1 Personality"]} />
        <Plan button_label="Upgrade" name="Pro" price={20} features={["1 Chatbot", "1 Voice", "1 Personality", "1 Chatbot", "1 Voice", "1 Personality"]} />
    </div>
}

export default Plans;