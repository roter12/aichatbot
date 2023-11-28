import { display_error } from "@/utils/notifications";

const Button = ({ children, onClick, className = "", color = "primary", disabled }: { onClick?: Function, disabled?: boolean, children: any, className?: string, color?: "primary" | "white" }) => {
    return <div onClick={onClick ? async () => {
        if (disabled) return;
        try {
            await onClick()
        } catch (error: any) {
            display_error(error.toString())
        }
    } : () => { }} className={
        `${disabled
            ? "text-[#444444] bg-[#DDDDDD] cursor-not-allowed"
            : " cursor-pointer " +
            (color === "primary"
                ? "bg-[#FF66BB] text-white "
                : "bg-white border text-black")
        }
           mx-2 inline-block mx-auto rounded-[14px] py-2 px-10 duration-200 ${className}`}>
        {children}
    </div>
}

export default Button;