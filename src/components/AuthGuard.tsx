import { Button, Loading } from "@nextui-org/react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import AccountBox from "./new/AccountBox";

const AuthGuard = ({ children }: { children: any }) => {

    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            const ref = router.query.ref as string;
            router.push("/signin?" + (ref ? "ref=&" + ref : "") + "forward=" + encodeURI(router.asPath));
        }
    }, [status]);

    return status === "authenticated"
        ? <div>
            {children}
            <AccountBox />
            {/* <div className="fixed top-5 right-5 cursor-pointer bg-[#F8F8F8] rounded-md px-5 py-2" onClick={() => signOut()}>
                {
                    session?.user?.name
                }
                <FaSignOutAlt className="inline-block ml-1" />
            </div> */}
        </div>
        : <Loading />
}

export default AuthGuard;