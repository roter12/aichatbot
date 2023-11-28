import Logo from "../Logo"
import Window from "./Window"

export const Progress = ({ percentage }: { percentage: number }) => {
    const stripesStyle = {
        backgroundImage: "linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.03) 75%, transparent 75%, transparent)",
        backgroundSize: "1rem 1rem"
    };

    const stripesStyleDark = {
        backgroundImage: "linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.02) 75%, transparent 75%, transparent)",
        backgroundSize: "1rem 1rem"
    };

    const shadowStyle = {
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 3px rgba(255,255,255,0.7)"
    };
    const shadowStyle2 = {
        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.7), 0 2px 3px rgba(0,0,0,0.2)"
    };

    return <div className="w-full inline-block float-right h-[40px] p-[8px] bg-black/5 rounded-full overflow-hidden" style={{ ...stripesStyleDark, ...shadowStyle }}>
        <div className={`w-[${percentage}%] h-full bg-[#f174a7] rounded-full shadow-inset shadow-white border-top-[1px] border-white duration-500`} style={{ ...stripesStyle, ...shadowStyle2, width: `${percentage}%` }}></div>
    </div>
}


const ProgressWindow = ({ children, title, percentage }: { children: any, title: string, percentage: number }) => {

    const percentage_adjusted = Math.min(3.5 + percentage * 0.965, 100);

    return <Window is_wide>
        <div className="border-b-[1px] text-left m-[-40px] mb-[20px] px-[40px] pb-[20px] pt-[30px]">
            <div className="inline-block">
                <Logo />
            </div>
            <div className="w-[400px] float-right">
                <Progress percentage={percentage_adjusted} />
            </div>
        </div>
        <div className="text-left">
            <div className="font-semibold text-[20px] mb-[30px] h-[50px]">
                {title}
            </div>
            {children}
        </div>
    </Window>
}

export default ProgressWindow;