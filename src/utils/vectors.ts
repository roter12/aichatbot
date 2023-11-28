import { ObjectId } from "mongodb";
import pinecone from "./pinecone";

export async function vectorize(text: string, openai_api_key: string) {
    const url = 'https://api.openai.com/v1/embeddings';
    const model = 'text-embedding-ada-002';

    const body = {
        input: text,
        model
    } as any;

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openai_api_key}`
        },
        body: JSON.stringify(body)
    });

    const json = await response.json();
    if (!json.data) {
        console.log(json);
        console.log("For text: " + text)
        throw new Error("OpenAI API error: " + JSON.stringify(json));
    }
    return json.data[0].embedding;
}

export async function find_similar_vectors(vector: number[], namespace: string, topK: number = 3) {
    return await pinecone(namespace).query({
        topK, vector
    }).then((result: any) => result.matches);
}

export async function submit_vectors(vectors: { id: string; values: number[]; metadata: any }[], namespace: string) {
    const url = process.env.PINECONE_URL + 'vectors/upsert';

    const body = {
        vectors,
        namespace
    } as any;

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': process.env.PINECONE_API_KEY as string
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log(result);
}

export async function delete_vectors(ids: string[], namespace: string) {
    const url = process.env.PINECONE_URL + 'vectors/delete';

    const body = {
        ids,
        namespace
    } as any;

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': process.env.PINECONE_API_KEY as string
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log(result);
}