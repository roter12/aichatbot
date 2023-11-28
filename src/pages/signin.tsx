import GradientBackground from "@/components/new/GradientBackground"
import LoginWindow from "@/components/new/windows/LoginWindow"
import { useRouter } from "next/router";
import { useEffect } from "react";

const Page = () => {

    const router = useRouter();

    async function on_signin() {
        router.push(decodeURI(router.query.forward as string) || process.env.NEXT_PUBLIC_HOME_PATH! || "/");
    }

    useEffect

    return <>
        <GradientBackground />
        <LoginWindow on_signin={on_signin} />
    </>
}

export default Page