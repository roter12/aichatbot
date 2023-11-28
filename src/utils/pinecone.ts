import { PineconeClient } from 'pinecone-client';

type Metadata = {
    directory: string
};

const pinecones: any = {};

export default function pinecone(namespace: string) {
    if (!pinecones[namespace]) {
        pinecones[namespace] = new PineconeClient<Metadata>({
            apiKey: process.env.PINECONE_API_KEY!,
            baseUrl: process.env.PINECONE_URL,
            namespace: namespace,
        });
    }
    return pinecones[namespace];
}