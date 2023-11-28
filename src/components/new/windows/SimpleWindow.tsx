import Logo from "../Logo"
import Window from "./Window"

export const Progress = ({ percentage }: { percentage: number }) => {
    return <div className="w-full inline-block float-right h-[30px] bg-black/5 rounded-full overflow-hidden">
        <div className="w-[80%] h-full bg-[#f174a7] rounded-full" style={{ width: `${percentage}%` }}></div>
    </div>
}

const SimpleWindow = ({ children, title, }: { children: any, title: string }) => {

    return <Window is_wide>
        <div className="border-b-[1px] text-left m-[-40px] mb-[20px] px-[40px] pb-[20px] pt-[30px]">
            <div className="inline-block">
                <Logo />
            </div>
        </div>
        <div className="text-left">
            <div className="font-semibold text-[20px] mb-[30px]">
                {title}
            </div>
            {children}
        </div>
    </Window>
}

export default SimpleWindow;