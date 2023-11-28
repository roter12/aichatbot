import { COLLECTION, mongo_get_or_post } from '@/utils/query_api_method';
import NextAuth, { User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { execute_mongo_get, execute_mongo_post } from '../[collection]';
import { Account } from '../[collection]/schemas';

function random_string(length: number) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

export default NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            profile: async (profile: any) => {

                const account = await execute_mongo_get(COLLECTION.ACCOUNT, { gmail: profile.email }, false) as Account;
                let account_id = account?._id.toString();

                if (!account_id) {
                    account_id = await execute_mongo_post(COLLECTION.ACCOUNT, [{
                        gmail: profile.email,
                        referral_code: random_string(6),
                    }]).then((ids: any) => ids[0]);
                }
                const imageUrl = profile.picture;
                return { ...profile, id: account_id, image: imageUrl };
            },

        })
    ],
    jwt: {
        maxAge: 60 * 60 * 24 * 30
    },
    secret: process.env.NEXTAUTH_SECRET!,

    callbacks: {
        async session({ session, user, token }: any) {

            if (token.picture) {
                session.user.image = token.picture;
            }

            return session;

            const account = await execute_mongo_get(COLLECTION.ACCOUNT, { gmail: session?.user?.email }, false) as Account;
            let account_id = account?._id.toString();

            if (!account_id) {
                account_id = await execute_mongo_post(COLLECTION.ACCOUNT, [{
                    gmail: session?.user?.email
                }]).then((ids: any) => ids[0]);
            }

            return { ...session, user: { ...session.user, _id: account_id } };
        }
    },
});




