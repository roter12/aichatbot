import AccountBox from '@/components/new/AccountBox';
import { Box, InnerBox } from '@/components/new/Box';
import GradientBackground from '@/components/new/GradientBackground';
import LineGraph from '@/components/new/LineGraph';
import useGet from '@/utils/hooks/useGet';
import { display_success } from '@/utils/notifications';
import Grid from '@mui/material/Grid';
import moment from 'moment';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { FaCopy } from 'react-icons/fa';
import { Account, Referral } from '../api/[collection]/schemas';
import { COLLECTION } from '@/utils/query_api_method';
import { Loading } from '@nextui-org/react';

const Logo = () => {
    return <div className="font-semibold text-[30px] text-[#f174a7] inline-block">Logo</div>
}

const NavItem = ({ label, is_selected }: { label: string, is_selected: boolean }) => {
    return <div className={`${is_selected ? "text-white" : "text-[#5B7AA3]"} cursor-pointer px-[20px] font-semibold text-[16px] inline-block`}>{label}</div>
}

const NavItems = () => {
    return <div className='inline-block align-top mt-[10px] ml-[60px] text-[14px]'>
        <NavItem is_selected={true} label="Dashboard" />
        <NavItem is_selected={false} label="Users" />
        <NavItem is_selected={false} label="Messages" />
        <NavItem is_selected={false} label="Billing" />
    </div>
}
const TopNav = () => {
    return <div className="z-[1000] bg-[#21284a] fixed top-0 left-0 right-0 h-[80px]">
        <div className='mt-5 max-w-[80vw] mx-auto'>
            <Logo />
            <NavItems />
            <AccountBox />
        </div>
    </div>
}

const ChartSmall = ({ color, value, values, label, is_selected }:
    { color: string, value: number, values: { x: number, y: number }[], label: string, is_selected: boolean }) => {
    return <Box className={`h-[130px] cursor-pointer ${is_selected ? "bg-[#21284A] text-white" : ""} flex`}>
        <div className='inline-block'>
            <div className='text-[35px] font-semibold mb-[10px]'>{value}</div>
            <div className={`text-[20px] font-semibold ${is_selected ? "text-white" : "text-[#5B7AA3]"}`}>{label}</div>
        </div>
        <div className='inline-block w-[50%]'>
            <LineGraph
                color={color}
                values={[
                    {
                        x: 0,
                        y: 10
                    },
                    {
                        x: 5,
                        y: 8
                    },
                    {
                        x: 10,
                        y: 30
                    },
                    {
                        x: 15,
                        y: 25
                    },
                    {
                        x: 20,
                        y: 40
                    },
                    {
                        x: 25,
                        y: 20
                    }
                ]}
            />
        </div>
    </Box>
}

const ChartsLeft = ({ labels, colors, values, current_values, selected_index, set_selected_index }:
    {
        labels: string[],
        colors: string[],
        current_values: number[],
        values: { x: number, y: number }[][],
        selected_index: number,
        set_selected_index: (index: number) => void
    }) => {


    return <Grid container rowSpacing={4} columnSpacing={0}>
        {
            labels.map((label, index) => {
                return <Grid item xs={12} key={index}>
                    <div onClick={() => set_selected_index(index)}>
                        <ChartSmall color={colors[index]} is_selected={selected_index === index} value={current_values[index]} values={values[index]} label={label} />
                    </div>
                </Grid>
            })
        }
    </Grid>
}

const ChartRight = ({ color, values }: { color: string, values: { x: number, y: number }[] }) => {
    return <Box className="h-[100%]">

        <LineGraph
            color={color}
            values={values}
        />

    </Box>
}

const Charts = () => {

    const [selected_index, set_selected_index] = useState(0);

    const labels = ['Messages Sent', 'Total Replies', 'Actions Taken', 'Hours Saved']
    const values = [
        [
            {
                x: 0,
                y: 10
            },
            {
                x: 5,
                y: 8
            },
            {
                x: 30,
                y: 30
            },
            {
                x: 15,
                y: 25
            },
            {
                x: 20,
                y: 40
            },
            {
                x: 25,
                y: 20
            }
        ],
        [
            {
                x: 0,
                y: 10
            },
            {
                x: 5,
                y: 8
            },
            {
                x: 10,
                y: 30
            },
            {
                x: 15,
                y: 25
            },
            {
                x: 20,
                y: 40
            },
            {
                x: 25,
                y: 20
            }
        ],
        [
            {
                x: 0,
                y: 10
            },
            {
                x: 5,
                y: 8
            },
            {
                x: 10,
                y: 30
            },
            {
                x: 15,
                y: 25
            },
            {
                x: 20,
                y: 40
            },
            {
                x: 25,
                y: 20
            }
        ],
        [
            {
                x: 0,
                y: 10
            },
            {
                x: 5,
                y: 8
            },
            {
                x: 10,
                y: 30
            },
            {
                x: 15,
                y: 25
            },
            {
                x: 20,
                y: 40
            },
            {
                x: 25,
                y: 20
            }
        ]
    ]
    const colors = ['#FF0088', '#00DF8D', '#8866FF', '#00C7FF']
    const current_values = [100, 200, 300, 400]

    return <Grid container spacing={4}>
        <Grid item xs={3}>
            <ChartsLeft
                current_values={current_values}
                labels={labels}
                values={values}
                colors={colors}
                selected_index={selected_index}
                set_selected_index={set_selected_index} />
        </Grid>
        <Grid item xs={9}>
            <ChartRight color={colors[selected_index]} values={values[selected_index]} />
        </Grid>
    </Grid>
}

const Buttons = () => {
    return <Grid container spacing={4} marginTop={1}>
        <Grid item xs={6}>
            <Box className='cursor-pointer font-semibold text-[#1B66FF]'>Customize my bot</Box>
        </Grid>
        <Grid item xs={6}>
            <Box className='cursor-pointer font-semibold'>Just Me
                <label className='ml-3 text-[#1B66FF]'>$50/month</label>
                <label className='float-right text-[#FF0000]'>Change</label>
            </Box>
        </Grid>
    </Grid>
}

const ReferralStats = ({ referral_url }: { referral_url: string }) => {

    function copy() {
        navigator.clipboard.writeText(referral_url);
        display_success("Copied to clipboard")
    }

    return <Grid container spacing={4}>
        <Grid item xs={6}>
            <InnerBox className='text-black/50 py-[22px]'>
                {referral_url}
                <div className='bg-[#1B66FF] rounded-full w-[30px] h-[30px] float-right text-white pt-[7px] cursor-pointer'>
                    <FaCopy className='mx-auto' onClick={copy} />
                </div>
            </InnerBox>
        </Grid>
        <Grid item xs={3}>
            <InnerBox className='font-semibold py-[22px]'>
                Total Join
                <div className='float-right text-[#1B66FF] font-bold'>25</div>
            </InnerBox>
        </Grid>
        <Grid item xs={3}>
            <InnerBox className='font-semibold py-[22px]'>
                Earn From Referral
                <div className='float-right text-[#1B66FF] font-bold'>$450</div>
            </InnerBox>
        </Grid>
    </Grid>
}

const ReferralTable = ({ account_id, referral_url }: {
    account_id: string,
    referral_url: string
}) => {

    const { data: referrals } = useGet<Referral[]>(COLLECTION.REFERRAL, { referrer: account_id }, true, false)

    return <table className='w-full text-[14px]'>
        <tbody>
            <tr className='text-[#5B7AA3] border-b-[1px] border-[#5B7AA3]/10'>
                <th className='font-semibold p-3 text-left'>Referral Date</th>
                <th className='font-semibold p-3 text-left'>Link</th>
                <th className='font-semibold p-3 text-left'>Status</th>
                <th className='font-semibold p-3 text-left'>Earning</th>
            </tr>
            {
                referrals?.map((referral, index) => (
                    <tr key={index} className='border-b-[1px] border-[#5B7AA3]/10'>
                        <td className='font-semibold p-3'>{moment(referral.created * 1000).format("DD MMM YYYY")}</td>
                        <td className='font-semibold p-3 text-[#5B7AA3]'>{referral_url}</td>
                        <td className='font-semibold p-3'>
                            <div className='rounded-[10px] py-1 px-2 text-[#00DFCD] bg-[#00DDBB]/10 inline-block'>JOINED</div>
                        </td>
                        <td className='font-semibold p-3'>$25</td>
                    </tr>
                ))
            }
        </tbody>
    </table>
}

const Referrals = () => {

    const { data: session } = useSession();
    const { data: account } = useGet<Account>(COLLECTION.ACCOUNT, { gmail: session?.user?.email }, false, !session)
    const referral_url = process.env.NEXT_PUBLIC_API_PATH?.replace("/api", "") + "?ref=" + account?.referral_code;

    if (!account) {
        return <Loading />
    }

    return <Box className="mt-[30px]">
        <ReferralStats referral_url={referral_url} />
        <ReferralTable account_id={account?._id.toString()} referral_url={referral_url} />
    </Box>
}

const Content = () => {
    return <div className="absolute top-[120px] w-[80vw] max-w-[1500px] left-[50vw] translate-x-[-50%] pb-[100px]">
        <Charts />
        <Buttons />
        <Referrals />
    </div>
}

const Dashboard = () => {
    return <>
        <TopNav />
        <Content />
    </>
}

const Page = () => {
    return <>
        <GradientBackground />
        <Dashboard />
    </>
}

export default Page