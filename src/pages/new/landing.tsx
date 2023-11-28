
const GradientBackground = () => {
    return <div className="fixed top-0 right-0 bottom-0 left-0 gradient"></div>
}

const NavItem = ({ children }: { children?: any }) => {
    return <div className="text-[20px] font-semibold inline-block w-[150px]">{children}</div>
}

const Header = () => {
    return <div className="p-10">
        <NavItem>Features</NavItem>
        <NavItem>Why us</NavItem>
        <NavItem>Pricing</NavItem>
    </div>
}

const Headline = () => {
    return <div className="font-bold text-[80px] w-[600px] leading-[100px] mb-[30px]">
        Manage faster and sell more with ChatVIP.
    </div>
}

const Subline = () => {
    return <div className="font-semibold text-[26px] w-[600px] leading-[30px]">
        ChatVIP is a customer messaging platform for sales, marketing and support.
    </div>
}

const Page = () => {
    return <>
        <GradientBackground />
        <div className="fixed">
            <Header />
            <div className="w-[80vw] fixed left-[50vw] translate-x-[-50%]">
                <Headline />
                <Subline />
            </div>
            <img src="/ice.png" />
        </div>
    </>
}

export default Page