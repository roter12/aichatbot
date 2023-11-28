import Cors from 'cors';
import fs from "fs";
import { NextApiRequest, NextApiResponse } from 'next';

const cors = Cors({
    methods: ['GET', 'HEAD'],
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }

            return resolve(result);
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await runMiddleware(req, res, cors);

    const buffer = fs.readFileSync("./public/precompile/Chat.js");
    const file_content = buffer.toString();
    res.send(file_content)
}