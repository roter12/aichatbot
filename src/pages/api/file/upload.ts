import multer from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'cors';
import nextConnect from 'next-connect';

const upload = multer({
    storage: multer.diskStorage({
        destination: '/tmp',
        filename: (req: any, file: any, callback: any) => callback(null, req.query.filename)
    })
});

const apiRoute = nextConnect({
    onError(error: any, req: any, res: any) {
        console.error(error);
        res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
    },
    onNoMatch(req: any, res: any) {
        res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
    }
});

const corsOptions = {
    origin: (origin: any, callback: any) => {
        callback(null, true);
    }
};

// Custom CORS middleware
const corsMiddleware = (req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return next();
};

apiRoute.options('*', cors(corsOptions));
apiRoute.use(corsMiddleware);
apiRoute.use(upload.array('file'));

apiRoute.post(cors(corsOptions), (req: NextApiRequest, res: NextApiResponse) => {
    console.log('uploaded!');
    res.status(200).json({ data: 'success' });
});

export default apiRoute;

export const config = {
    api: {
        bodyParser: false
    }
};

export {};
