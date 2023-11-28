import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';

const BODY_REQUESTS = ['POST', 'PUT']

export default function wrap_api_function(execute: (body: any, req: NextApiRequest, res: NextApiResponse) => any) {
    return async function handler(req: NextApiRequest, res: NextApiResponse<{ data: any } | { error: string }>) {
        try {
            await NextCors(req, res, {
                methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
                origin: '*',
                optionsSuccessStatus: 200
            });
            const body = BODY_REQUESTS.includes(req.method as string)
                ? req.body
                : req.query.body
                    ? JSON.parse(decodeURI(req.query.body as string))
                    : req.query;
            const data = await execute(body,
                req, res);
            res.status(200).json({ data });
        } catch (error: any) {
            console.log(error);
            res.status(400).json({ error: error.toString() });
        }
    };
}
