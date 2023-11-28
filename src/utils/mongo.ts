import send_email from "@/pages/api/utils/send_email";
import { MongoClient, ServerApiVersion } from "mongodb"
import fs from 'fs';
import path from 'path';

let mongo_db_password = process.env.MONGODB_PASSWORD!
const mongo_db_uri = process.env.MONGODB_URL!.replace("<password>", mongo_db_password)
const mongo_client = new MongoClient(mongo_db_uri, {
    serverApi: ServerApiVersion.v1,
    socketTimeoutMS: 30000,
    maxIdleTimeMS: 30000,
})

const FILENAME = "last_time_mongodb_email_sent.txt"
const filepath = path.join(process.cwd(), FILENAME);

let db: any;

async function connect() {
    try {
        await mongo_client.connect()
        // console.log('MongoDB connected!')
        db = mongo_client.db(process.env.MONGODB_DATABASE!)
    } catch (error) {
        console.error('Error connecting to MongoDB', error)
        on_connection_error(error);
    }
}

async function disconnect() {
    await mongo_client.close()
    console.log('MongoDB disconnected!')
}

const MIN_EMAIL_INTERVAL = 3600; // 1 hour

async function get_db() {
    if (!db) {
        await connect()
            .catch(on_connection_error);
    }
    return db;
}

async function on_connection_error(error: any) {
    const seconds_since_last_time_email_sent = get_seconds_since_last_time_email_sent();
    if (seconds_since_last_time_email_sent === null || seconds_since_last_time_email_sent > MIN_EMAIL_INTERVAL) {
        set_last_time_email_sent();
        console.error('Error connecting to MongoDB', error);
        await send_email("Error connecting to MongoDB", error.toString(), process.env.ADMIN_EMAIL!);
    }
}

function get_seconds_since_last_time_email_sent() {
    const last_time_email_sent = fs.existsSync(filepath)
        ? fs.readFileSync(filepath, 'utf8')
        : null;
    return last_time_email_sent
        ? (Date.now() - parseInt(last_time_email_sent)) / 1000
        : null;
}

function set_last_time_email_sent() {
    const now = Date.now();
    fs.writeFileSync(filepath, now.toString());
}

connect();

['SIGINT', 'SIGTERM', 'uncaughtException'].forEach(signal =>
    process.on(signal as any, async () => {
        await disconnect();
        process.exit(0);
    })
)

export { get_db };
