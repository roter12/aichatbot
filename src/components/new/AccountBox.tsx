import { signOut, useSession } from "next-auth/react";
import { useState } from "react";


const AccountBox = () => {

    const { data: session } = useSession();
    const [is_dropdown_open, set_is_dropdown_open] = useState(false);

    return <div className='fixed top-5 right-10'>
        <div className='w-[32px] h-[32px] rounded-full bg-white mt-[5px] cursor-pointer'
            style={{
                backgroundImage: `url(${session?.user?.image})`,
                backgroundSize: "cover"
            }}
            onClick={() => set_is_dropdown_open(!is_dropdown_open)}>
        </div>
        <div className={`absolute top-[40px] right-0 w-[200px] rounded-lg bg-white shadow-lg ${is_dropdown_open ? "block" : "hidden"}`}>
            <div className='p-3'>
                <div className='font-semibold text-[#5B7AA3]'>{session?.user?.name}</div>
                <div className='text-[#5B7AA3]/70 text-[14px]'>{session?.user?.email}</div>
            </div>
            <div className='border-b-[1px] border-[#5B7AA3]/10'></div>
            <div className='p-3'>
                <div className='font-semibold text-[#5B7AA3] cursor-pointer mb-1'>Settings</div>
                <div className='font-semibold text-[#5B7AA3] cursor-pointer' onClick={() => signOut()}>Logout</div>
            </div>
        </div>
    </div>
}


export default AccountBox;