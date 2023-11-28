import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const filename = req.query.filename as string;
    const filePath = path.resolve('.', `/tmp/` + filename);
    const buffer = fs.readFileSync(filePath);
    res.setHeader(
        'Content-Type',
        filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    return res.send(buffer);
}
