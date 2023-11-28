import Select from '@/components/Select';
import { Button, Input } from '@nextui-org/react';
import { useState } from 'react';
import countries from "../pages/earnings/countries.json";
import { COLLECTION, mongo_get, mongo_post } from '@/utils/query_api_method';
import { display_error, display_success } from '@/utils/notifications';
import { useRouter } from 'next/router';
import GradientBackground from '@/components/new/GradientBackground';
import { Creator } from '../pages/api/[collection]/schemas';

function get_country_emoji(code: string) {
    const flagOffset = 0x1F1E6;
    const asciiOffset = 0x41;

    const firstChar = code.charCodeAt(0) - asciiOffset + flagOffset;
    const secondChar = code.charCodeAt(1) - asciiOffset + flagOffset;

    return String.fromCodePoint(firstChar) + String.fromCodePoint(secondChar);
}

const SignupForm = ({ on_signin }: { on_signin: Function }) => {

    const [name, set_name] = useState('')
    const [email, set_email] = useState('')
    const [birthdate, set_birthdate] = useState('')
    const [residence, set_residence] = useState('US')
    const [instagram, set_instagram] = useState('')
    const [whatsapp, set_whatsapp] = useState('')
    const [username, set_username] = useState('')
    const [password, set_password] = useState('')

    const router = useRouter();

    async function signup() {

        const existing_creators_with_username = await mongo_get(COLLECTION.CREATOR, {
            username
        });

        if (existing_creators_with_username.length > 0) {
            display_error('Username already exists');
            return;
        }

        await mongo_post(COLLECTION.CREATOR, [{
            name,
            email,
            birth_year: parseInt(birthdate.split('-')[0]),
            birth_month: parseInt(birthdate.split('-')[1]),
            birth_day: parseInt(birthdate.split('-')[2]),
            residence,
            instagram,
            whatsapp,
            username,
            password
        }]).then(() => {
            display_success('You are now a creator!');
            on_signin(username);
        }).catch(display_error)
    }

    return <table className='text-left mx-auto'>
        <tbody>
            <tr>
                <td className='w-[200px]'>
                    Full Name
                </td>
                <td className='pb-2'>
                    <Input placeholder="Full Name" value={name} onChange={e => set_name(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td>
                    Email
                </td>
                <td className='pb-2'>
                    <Input placeholder="Email" value={email} onChange={e => set_email(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td>
                    Birth Date
                </td>
                <td className='pb-2'>
                    <Input type='date' placeholder="birthdate" value={birthdate} onChange={e => set_birthdate(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td>
                    Residence
                </td>
                <td className='pb-2'>
                    <Select
                        placeholder='Residence'
                        options={countries.map(country => get_country_emoji(country.code) + " " + country.name)}
                        keys={countries.map(country => country.code)}
                        selected={residence}
                        onSelect={set_residence} />
                </td>
            </tr>
            <tr>
                <td className='w-[200px]'>
                    Instagram Handle
                </td>
                <td className='pb-2'>
                    <Input placeholder="Instagram Handle" value={instagram} onChange={e => set_instagram(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td className='w-[200px]'>
                    WhatsApp Number
                </td>
                <td className='pb-5'>
                    <Input placeholder="WhatsApp Number" value={whatsapp} onChange={e => set_whatsapp(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td>
                    Username
                </td>
                <td className='pb-2'>
                    <Input placeholder="Username" value={username} onChange={e => set_username(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td>
                    Password
                </td>
                <td className='pb-2'>
                    <Input type='password' placeholder="Password" value={password} onChange={e => set_password(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td></td>
                <td>
                    <Button color={"gradient"} onClick={signup} className='bg-[#FF66BB]'>Become a Creator</Button>
                </td>
            </tr>
        </tbody>
    </table>
}

const SigninForm = ({ on_signin }: { on_signin: Function }) => {

    const [username, set_username] = useState('')
    const [password, set_password] = useState('')

    const [is_signing_in, set_is_signing_in] = useState(false);
    const router = useRouter();

    async function is_password_correct() {
        const creator = await mongo_get(COLLECTION.CREATOR, { username }, { multiple: false }) as Creator;
        return creator?.password === password;
        // if (username === "anastasia" && password === "anastasia123") return true;
        // if (username === "laura" && password === "laura456") return true;
        // return false;
    }

    async function sign_in() {
        set_is_signing_in(true);
        if (await is_password_correct()) {
            on_signin(username);
        } else {
            display_error("Incorrect password");
        }
        set_is_signing_in(false)
    }


    return <table className='text-left mx-auto'>
        <tbody>
            <tr>
                <td>
                    Username
                </td>
                <td className='pb-2'>
                    <Input placeholder="Username" value={username} onChange={e => set_username(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td>
                    Password
                </td>
                <td className='pb-2'>
                    <Input type='password' placeholder="Password" value={password} onChange={e => set_password(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td></td>
                <td>
                    <Button color={"gradient"} onClick={sign_in} className='bg-[#FF66BB]'>
                        {is_signing_in ? "Signing in..." : "Sign in"}
                    </Button>
                </td>
            </tr>
        </tbody>
    </table>
}

const Title = ({ children }: { children: string }) => {
    return <div className='text-2xl font-bold mb-10'>
        {children}
    </div>
}

const Window = ({ children }: { children: any }) => {
    return <div className='bg-white w-[600px] rounded-lg shadow-xl mx-auto p-10 mt-[200px] text-center'>
        {children}
    </div>
}

const SignupWindow = ({ on_signin }: { on_signin: Function }) => {
    return <Window>
        <Title>  Become a Creator 🚀</Title>
        <SignupForm on_signin={on_signin} />
    </Window>
}

const SigninWindow = ({ on_signin }: { on_signin: Function }) => {
    return <Window>
        <Title>  Sign in 🚀</Title>
        <SigninForm on_signin={on_signin} />
    </Window>
}
const SigninOrUpWindow = ({ on_signin }: { on_signin: Function }) => {

    const [is_signin, set_is_signin] = useState(false);
    const [is_signup, set_is_signup] = useState(false);

    if (is_signin) {
        return <SigninWindow on_signin={on_signin} />
    }

    if (is_signup) {
        return <SignupWindow on_signin={on_signin} />
    }

    return <Window>
        <Title>Creator Portal 🚀</Title>
        <div className='flex justify-center mb-10'>

            <Button color={"gradient"} onClick={() => {
                set_is_signin(true);
                set_is_signup(false);
            }} className='bg-[#FF66BB] mx-1'>Sign in</Button>

            <Button color={"gradient"} onClick={() => {
                set_is_signin(false);
                set_is_signup(true);
            }} className='bg-[#FF66BB] mx-1'>Become a creator</Button>
        </div>
    </Window>
}

const CreatorSignin = ({ on_signin }: { on_signin: Function }) => {

    return <>
        <GradientBackground />
        <div className='fixed top-0 left-0 right-0 bottom-0'>
            <SigninOrUpWindow on_signin={on_signin} />
        </div>
    </>
}

export default CreatorSignin