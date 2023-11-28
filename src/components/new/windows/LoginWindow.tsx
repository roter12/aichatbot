import { useEffect } from "react";
import Logo from "../Logo";
import Window from "./Window";
import { signIn, signOut, useSession } from "next-auth/react";
import { COLLECTION, mongo_get, mongo_post } from "@/utils/query_api_method";
import { useRouter } from "next/router";
import { Account } from "@/pages/api/[collection]/schemas";
import { display_error } from "@/utils/notifications";

const FacebookLoginButton = ({ on_signin }: {
    on_signin: Function
}) => {
    return <div className="relative cursor-pointer text-center p-3 rounded-lg border bg-[#FBFbFb] font-semibold" onClick={() => signIn("google")}>
        <div className="absolute w-[24px] h-[24px] rounded-full bg-cover bg-[url('/google.png')]"></div>
        Continue with Google
    </div>
}

const LoginWindow = ({ on_signin }: {
    on_signin: Function
}) => {
    const router = useRouter();
    const referral_code = router.query.ref as string;
    const { data: session } = useSession();

    async function on_session(session: any) {
        const email = session.user?.email;

        if (referral_code) {
            const referrer = await mongo_get(COLLECTION.ACCOUNT, { referral_code }, { multiple: false }) as Account;
            const referred = await mongo_get(COLLECTION.ACCOUNT, { gmail: session?.user.email }, { multiple: false }) as Account;
            
            if(!referrer || !referred) {
                display_error("Could not find referrer or referred");
            }

            await mongo_post(COLLECTION.REFERRAL, [{
                referrer: referrer._id,
                referred: referred._id
            }])
        }

        on_signin({ email });
    }

    useEffect(() => {
        if (session) {
            on_session(session);
        }
    }, [session]);

    return <Window>
        <Logo />
        <div className="font-semibold text-[30px] my-5">Welcome Back</div>
        <div className="font-semibold text-[18px] text-black/60">Please login to continue</div>
        <div className="h-[300px] mt-[50px]">
            <FacebookLoginButton on_signin={on_signin} />
        </div>
        <div className="flex">
            <div className="w-[50%] font-semibold text-black/60">No account?</div>
            <div className="w-[50%] font-semibold text-[#1B66FF] cursor-pointer">Create an Account</div>
        </div>
    </Window>
}

export default LoginWindow;