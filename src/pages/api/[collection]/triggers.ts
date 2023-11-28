import { ObjectId } from 'mongodb';
import { COLLECTION, mongo_delete, mongo_post } from '@/utils/query_api_method';
import { Chunk, Directory, SalesBot, Text } from './schemas';
import { delete_vectors, submit_vectors, vectorize } from '@/utils/vectors';
import { get_db } from '@/utils/mongo';

async function store_chunks_on_pinecone(chunks: Chunk[], namespace: string, openai_key: string) {

    const vector_promises = chunks.map(async ({ _id, content }: Chunk) => {
        const vector = await vectorize(content, openai_key);
        return {
            id: _id.toString(),
            values: vector,
            metadata: {}
        };
    });
    const vectors = await Promise.all(vector_promises);

    await submit_vectors(vectors, namespace);
}


async function store_text_in_chunks(text: Text) {
    const CHUNK_LENGTH = 700;
    var chunks: { content: string, chunk_index: number, text: ObjectId }[] = [];
    for (let chunk_index = 0; chunk_index < text.content.length / CHUNK_LENGTH; chunk_index++) {
        const offset = chunk_index * CHUNK_LENGTH;
        const content = text.content.substring(offset, offset + CHUNK_LENGTH);

        const chunk = {
            content,
            chunk_index,
            text: text._id
        };
        chunks.push(chunk);

        if (chunks.length >= 100) {
            await mongo_post(COLLECTION.CHUNK, chunks);
            chunks = [];
        }
    }

    if (chunks.length > 0) {
        await mongo_post(COLLECTION.CHUNK, chunks);
    }

    return chunks;
}

export type Trigger = {
    on_post?: (ids: ObjectId[]) => Promise<void>;
    on_put?: (ids: ObjectId[]) => Promise<void>;
    on_delete?: (ids: ObjectId[]) => Promise<void>;
};

const ChunkTrigger: Trigger = {
    on_post: async (_ids) => {
        const db = await get_db();
        const chunks = await db.collection(COLLECTION.CHUNK).find({ _id: { $in: _ids } }).toArray() as Chunk[];
        // TODO below line only looks at the first chzbk (chunks[0])
        const text = await db.collection(COLLECTION.TEXT).findOne({ _id: chunks[0].text }) as Text;
        const directory = await db.collection(COLLECTION.DIRECTORY).findOne({ _id: text.directory }) as Directory;
        const salesbot = await db.collection(COLLECTION.SALESBOT).findOne({ _id: directory.salesbot }) as SalesBot;
        await store_chunks_on_pinecone(chunks, directory.salesbot.toString(), salesbot.settings.openai_key);
    },
    on_delete: async (_ids) => {
        const db = await get_db();
        const chunks = await db.collection(COLLECTION.CHUNK).find({ _id: { $in: _ids } }).toArray() as Chunk[];
        if (chunks.length > 0) {
            const text = await db.collection(COLLECTION.TEXT).findOne({ _id: chunks[0].text }) as Text;
            const directory = await db.collection(COLLECTION.DIRECTORY).findOne({ _id: text.directory }) as Directory;
            await delete_vectors(_ids.map(_id => _id.toString()), directory.salesbot.toString());
        }
    }
};

const TextTrigger: Trigger = {
    on_post: async (_ids) => {
        const db = await get_db();
        const texts = await db.collection(COLLECTION.TEXT).find({ _id: { $in: _ids } }).toArray() as Text[];
        for (const text of texts) {
            await store_text_in_chunks(text);
        }
    },
    on_delete: async (_ids) => {
        await mongo_delete(COLLECTION.CHUNK, { text: { $in: _ids } });
    },
    on_put: async (_ids) => {
        const db = await get_db();
        const texts = await db.collection(COLLECTION.TEXT).find({ _id: { $in: _ids } }).toArray() as Text[];
        await mongo_delete(COLLECTION.CHUNK, { text: { $in: _ids } });
        for (const text of texts) {
            await store_text_in_chunks(text);
        }
    }
};

const DirectoryTrigger: Trigger = {
    on_delete: async (_ids) => {
        await mongo_delete(COLLECTION.TEXT, { directory: { $in: _ids.map(id => id.toString()) } })
    },
};

const Statetrigger: Trigger = {
    on_delete: async (_ids) => {
        await mongo_delete(COLLECTION.TRANSITION, { state_from: { $in: _ids.map(id => id.toString()) } })
        await mongo_delete(COLLECTION.TRANSITION, { state_to: { $in: _ids.map(id => id.toString()) } })
    },
}

export const TRIGGERS: any = {
    chunk: ChunkTrigger,
    text: TextTrigger,
    directory: DirectoryTrigger,
    state: Statetrigger,
};
