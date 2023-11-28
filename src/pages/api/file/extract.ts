import extract_pdf from 'pdf-text-extract';
import mammoth from 'mammoth';
import axios from 'axios';
import fs, { existsSync } from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import wrap_api_function from '@/utils/wrap_api_function';
import query_api from '@/utils/query_api';

async function execute(body: any) {
    if (body.path.split('/').length !== 3 || body.path.split('/')[1] !== 'tmp') {
        throw new Error('Invalid path');
    }

    const filename = body.path.split('/')[2];
    const localFilePath = '/tmp/' + filename;
    if (!existsSync(localFilePath)) {
        const url = 'https://promochat.ai/api/file/get?filename=' + filename;

        const response = await axios.get(url, { responseType: 'stream' });

        // Write the file locally
        response.data.pipe(fs.createWriteStream(localFilePath));

        // Listen for 'finish' event to know when writing is complete
        response.data.on('finish', () => {
            return 'File downloaded and saved locally';
        });

        // Listen for 'error' event to catch any errors
        response.data.on('error', (error: any) => {
            throw error;
        });
    }

    return new Promise((resolve, reject) => {
        if (body.path.endsWith('.pdf')) {
            extract_pdf(body.path, function (err: any, pages: any) {
                if (err) {
                    reject(err);
                }
                resolve(pages);
            });
        } else if (body.path.endsWith('.docx')) {
            var buffer = fs.readFileSync(body.path);
            mammoth.extractRawText({ buffer }).then((result) => resolve([result.value]));
        } else if (body.path.endsWith('.txt')) {
            var buffer = fs.readFileSync(body.path);
            resolve([buffer.toString()]);
        } else if (body.path.endsWith('.mp3') || body.path.endsWith('.wav')) {
            query_api("audio/speakers", { path: body.path })
                .then((result: { speaker: string, text: string }[]) => resolve([
                    result.map(
                        ({ speaker, text }) => speaker + ": " + text
                    ).join("\n\n")
                ]))
        }
        else {
            reject('Unsupported file type');
        }
    });
}

const handler = wrap_api_function(execute);
export default handler;
