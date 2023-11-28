import '@/styles/globals.css'
import { NextUIProvider } from '@nextui-org/react';
import { NotificationContainer } from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import { SessionProvider, useSession } from 'next-auth/react';
import Head from 'next/head';
import { AppProps } from 'next/app';
import AuthGuard from '@/components/AuthGuard';
import { useRouter } from 'next/router';


export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {

    const OPEN_PATHS = [
        "/checkout",
        "/api/checkout",
        "/creators",
        "/new",
        "/demo",
        "/flow",
        "/signin"
        // "/telegram",
        // "/mybots"
    ]

    const router = useRouter();
    const requires_auth = !OPEN_PATHS.includes(router.pathname);

    console.log(router.pathname)

    return (
        <>
            <Head>
                <title>{process.env.NEXT_PUBLIC_API_PATH!.split('/')[2].split(":")[0]}</title>
                <meta name="viewport" content="width=device-width, initial-scale=0.7, maximum-scale=0.7" />
            </Head>
            <NotificationContainer />
            <NextUIProvider>
                <SessionProvider session={session}>
                    <NotificationContainer>
                    </NotificationContainer>
                    {
                        requires_auth
                            ? <AuthGuard>
                                <Component {...pageProps} />
                            </AuthGuard>
                            : <Component {...pageProps} />
                    }
                </SessionProvider>
            </NextUIProvider>
        </>
    );
}
