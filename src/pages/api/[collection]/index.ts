import { NextApiRequest, NextApiResponse } from 'next';
import moment from 'moment';
import { Collection, ObjectId } from 'mongodb';
import { TYPE_DECLARATIONS, TypeDeclaration } from './schemas';
import { TRIGGERS, Trigger } from './triggers';
import wrap_api_function from '@/utils/wrap_api_function';
import { get_db } from '@/utils/mongo';

let collections: any = {};

function dto(body?: Record<string, any>, fillable?: any) {
    if (!fillable) return body;
    if (!body) return Object.fromEntries(fillable.map((key: any) => [key, undefined]));
    const obj = Object.fromEntries(Object.entries(body).filter(([key, _]) => fillable?.includes(key)));
    return obj;
}

async function get_collection(collection_name: string) {
    if (!collections[collection_name]) {
        const db = await get_db();
        collections[collection_name] = db.collection(collection_name);
    }
    return collections[collection_name];
}

function format_document(document_raw: any) {
    return {
        deleted: false,
        created: moment().unix(),
        ...document_raw
    };
}

function validate_types(document: any, type_declaration: TypeDeclaration) {
    for (const field of type_declaration) {
        const required_type = field.type;
        const actual_type = typeof document[field.name];
        if (!field.required && actual_type === 'undefined') {
            continue;
        }
        if (required_type === 'ObjectId' ? !ObjectId.isValid(document[field.name]) : required_type !== actual_type) {
            throw new Error(`Field ${field.name} has type ${actual_type} but should be ${required_type}`);
        }
    }
}

function require_fields(document: any, type_declaration: TypeDeclaration) {
    const required_fields = type_declaration.filter((field) => field.required).map((field) => field.name);
    for (const required_field of required_fields) {
        if (document[required_field] === undefined) {
            throw new Error(`Document is missing required field '${required_field}'`);
        }
    }
}

function fill_default_values_fields(document: any, type_declaration: TypeDeclaration) {
    const fields_with_default_values = type_declaration.filter((field) => field.default_value !== undefined);
    for (const field of fields_with_default_values) {
        if (document[field.name] === undefined) {
            document[field.name] = field.default_value;
        }
    }
}

function add_object_ids(document: any, type_declaration: TypeDeclaration) {
    const extended_type_declaration = [
        ...type_declaration,
        {
            name: '_id',
            type: 'ObjectId',
            required: false
        }
    ];
    for (const field of extended_type_declaration) {
        if (field.type === 'ObjectId' && document[field.name] !== undefined) {
            if (typeof document[field.name] === 'object') {
                convert_leaves_to_object_ids(document[field.name]);
            } else {
                document[field.name] = new ObjectId(document[field.name]);
            }
        }
    }
}

function convert_leaves_to_object_ids(obj: any) {
    if (typeof obj === 'object' && !Array.isArray(obj)) {
        // If the object is not an array and is an object
        for (const key in obj) {
            if (typeof obj[key] === 'object') {
                convert_leaves_to_object_ids(obj[key]); // Recursive call for nested objects
            } else {
                if (typeof obj[key] === 'string' && obj[key].length === 24) {
                    obj[key] = new ObjectId(obj[key]);
                }
            }
        }
    } else if (Array.isArray(obj)) {
        // If the object is an array
        for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === 'object') {
                convert_leaves_to_object_ids(obj[i]); // Recursive call for nested objects
            } else {
                if (typeof obj[i] === 'string' && obj[i].length === 24) {
                    obj[i] = new ObjectId(obj[i]);
                }
            }
        }
    }
}

function clean_document(document_raw: any, type_declaration: TypeDeclaration) {
    const all_fields = type_declaration.map((field) => field.name);
    const document = dto(document_raw, all_fields)!;
    fill_default_values_fields(document, type_declaration);
    require_fields(document, type_declaration);
    add_object_ids(document, type_declaration);
    validate_types(document, type_declaration);
    return document;
}

type MethodSignature = {
    collection_name: string;
    collection: Collection;
    multiple: boolean;
    query: any;
    body: any;
    req: NextApiRequest;
    res: NextApiResponse;
    type_declaration: TypeDeclaration;
    trigger?: Trigger;
    limit?: number;
    offset?: number;
    sort?: any;
};

async function execute_post({ type_declaration, body, collection, trigger }: MethodSignature) {
    const documents_raw = body.documents;
    const documents = documents_raw.map((document_raw: any) => clean_document(document_raw, type_declaration)).map(format_document);
    const ids = Object.values((await collection.insertMany(documents)).insertedIds);
    if (trigger?.on_post) {
        await trigger?.on_post(ids);
    }
    return ids.map((id) => id.toString());
}

export async function execute_inner(method: string, collection_name: string, query: any, multiple: boolean, limit = Number.MAX_SAFE_INTEGER, body: any, req: any, res: any) {
    const collection = await get_collection(collection_name);
    const type_declaration = TYPE_DECLARATIONS[collection_name];
    const trigger: Trigger | undefined = TRIGGERS[collection_name];
    const sort = body.sort || {};
    const offset = body.offset || 0;

    if (!type_declaration) {
        throw new Error(`No type declaration found for collection ${collection_name}`);
    }

    const all_fields = type_declaration.map((field: any) => field.name).concat(['_id', 'created', 'deleted']);
    const query_fields = Object.keys(query);
    const unallowed_fields = query_fields.filter((key) => !all_fields.includes(key.split('.')[0]));

    if (unallowed_fields.length > 0) {
        throw new Error('Invalid fields: ' + unallowed_fields.join(', '));
    }

    add_object_ids(query, type_declaration);

    const signature: MethodSignature = { sort, trigger, type_declaration, query, collection_name, collection, multiple, body, req, res, limit, offset };

    switch (method?.toLowerCase()) {
    case 'post':
        return await execute_post(signature);
    case 'put':
        return await execute_put(signature);
    case 'get':
        return await execute_get(signature);
    case 'delete':
        return await execute_delete(signature);
    default:
        throw new Error('Method ' + method + ' not allowed');
    }
}

async function execute_put({ query, multiple, trigger, collection, body, type_declaration }: MethodSignature) {
    const all_fields = type_declaration.map((field) => field.name);
    const unallowed_fields = Object.keys(body.$set).filter(
        (key) => !all_fields.includes(key)
            && !(
                key.includes(".")
                && all_fields.includes(key.split(".")[0])
                && type_declaration.find(({ name }) => name === key.split(".")[0])!.type === "object"
            )
    );

    if (unallowed_fields.length > 0) {
        throw new Error('Invalid fields: ' + unallowed_fields.join(', '));
    }

    if (multiple) {
        const ids = await collection.find(query).project({ _id: 1 }).toArray()
            .then(array => array.map(({ _id }) => _id))
        await collection.updateMany({ ...query }, { $set: body.$set });
        if (trigger?.on_put) {
            trigger.on_put(ids);
        }
    } else {
        const result = await collection.updateOne({ ...query }, { $set: body.$set });
        if (trigger?.on_put && result.upsertedId) {
            trigger.on_put([result.upsertedId]);
        };
    }
}

async function execute_get({ query, body, multiple, collection, limit, sort, offset }: MethodSignature) {
    if (body.count) {
        return await collection.countDocuments(query);
    }
    if (multiple) {
        return await collection.find({ ...query }).sort(sort).skip(offset || 0).limit(limit || Number.MAX_SAFE_INTEGER).toArray();
    } else {
        return await collection.findOne({ ...query });
    }
}

async function execute_delete({ query, trigger, multiple, collection, limit, sort }: MethodSignature) {
    const ids = await collection
        .find(query)
        .sort(sort)
        .limit(limit ? limit : Number.MAX_SAFE_INTEGER)
        .project({ _id: 1 })
        .toArray()
        .then((array) => array.map(({ _id }) => _id));
    if (trigger?.on_delete) {
        await trigger?.on_delete(ids);
    }
    if (multiple) {
        return await collection.deleteMany({ _id: { $in: ids } });
    } else {
        return await collection.deleteOne({ _id: { $in: ids } });
    }
}

async function execute(body: any, req: NextApiRequest, res: NextApiResponse) {
    const collection_name = req.query.collection as string;
    const multiple = body.multiple === undefined ? true : body.multiple;
    const query = body.query || {};
    const limit = body.limit || Number.MAX_SAFE_INTEGER;
    return await execute_inner(req.method!, collection_name, query, multiple, limit, body, req, res);
}

export async function execute_mongo_post(collection_name: string, documents: any[]): Promise<string[]> {
    const _ids = await execute_inner('POST', collection_name, {}, true, Number.MAX_SAFE_INTEGER, {
        documents
    }, null, null) as string[];
    return _ids;
}

export async function execute_mongo_get(collection_name: string, query: any, multiple: boolean, limit = Number.MAX_SAFE_INTEGER, sort?: any) {
    return await execute_inner('GET', collection_name, query, multiple, limit, { sort }, null, null);
}

export async function execute_mongo_delete(collection_name: string, query: any, multiple: boolean = false, limit = Number.MAX_SAFE_INTEGER) {
    return await execute_inner('DELETE', collection_name, query, multiple, limit, {}, null, null);
}

export async function execute_mongo_put(collection_name: string, query: any, $set: any, multiple: boolean = false) {
    return await execute_inner('PUT', collection_name, query, multiple, Number.MAX_SAFE_INTEGER, { $set }, null, null);
}

export default wrap_api_function(execute);
