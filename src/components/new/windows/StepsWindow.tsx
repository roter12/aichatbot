import Logo from "../Logo"
import Window from "./Window"

const Steps = ({ active, count }: { active: number, count: number }) => {
    return <div className="float-right inline-block mt-[5px]">
        {Array.from(Array(count).keys()).map((i) => <>
            <div className={`rounded-full inline-block w-[30px] h-[30px] text-[14px] text-center ${i < active ? "bg-[#f174a7] text-white pt-[4px]" : "bg-white text-black border pt-[3px]"}`}>
                {i + 1}
            </div>
            {
                i < count - 1 && <div className="w-[20px] mt-[15px] align-top bg-black/10 inline-block h-[1px]"></div>
            }
        </>)}
    </div>
}


const StepsWindow = ({ children, title, step }: { children: any, title: string, step: number }) => {

    return <Window is_wide>
        <div className="border-b-[1px] text-left m-[-40px] mb-[20px] px-[40px] pb-[20px] pt-[30px]">
            <div className="inline-block">
                <Logo />
            </div>
            <Steps active={step} count={6} />
        </div>
        <div className="text-left">
            <div className="font-semibold text-[20px] mb-[30px]">
                {title}
            </div>
            {children}
        </div>
    </Window>
}

export default StepsWindow;