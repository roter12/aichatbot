import Button from "../Button";
import Logo from "../Logo";
import Window from "./Window";

const WelcomeWindow = () => {
    return <Window is_wide>
        <Logo />
        <div className="font-semibold text-[30px] my-5">Welcome!</div>
        <div className="font-semibold text-[18px] text-black/60">Welcome! Let&apos;s get your personal AI set up and ready to work for you.<br />This will take about 5 minutes.</div>
        <div className="absolute bottom-[50px] left-0 right-0">
            <Button className="w-[300px] text-left px-3">
                Next
                <div className="float-right">&rarr;</div>
            </Button>
        </div>
    </Window>
}

export default WelcomeWindow;