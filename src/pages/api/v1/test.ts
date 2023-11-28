import wrap_api_function from "@/utils/wrap_api_function";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const api_key = req.body.api_key;
    try {
        const authorization = verifyAuthorizationCode(api_key);

        if (!authorization.isValid) {
            res.status(401).json({ error: 'Invalid authorization code' });
            return;
        }

        const accessToken = generateAccessToken(authorization.userId);

        res.status(200).json({ access_token: accessToken, token_type: 'bearer' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

function verifyAuthorizationCode(api_key: string) {

    if (!api_key) {
        throw new Error("api_key not provided");
    }
    if (!api_key.startsWith("0x")) {
        throw new Error("invalid api_key");
    }

    return {
        isValid: true,
        userId: 1
    };
}

function generateAccessToken(userId: number) {
    return "access_token";
}