import { ObjectId } from "mongodb";

export type TypeDeclaration = {
    name: string,
    type: string,
    required: boolean,
    default_value?: any,
}[];

function required_string(name: string, default_value?: any) {
    return _required_variable('string', name, default_value);
}

function required_number(name: string, default_value?: any) {
    return _required_variable('number', name, default_value);
}

function required_boolean(name: string, default_value?: any) {
    return _required_variable('boolean', name, default_value);
}

function required_object_id(name: string, default_value?: any) {
    return _required_variable('ObjectId', name, default_value);
}

function required_object(name: string, default_value?: any) {
    return _required_variable('object', name, default_value);
}

function _required_variable(type: string, name: string, default_value?: any) {
    return {
        name: name,
        type,
        required: true,
        default_value
    }
}

function optional_string(name: string) {
    return {
        name: name,
        type: 'string',
        required: false
    }
}

function optional_number(name: string) {
    return {
        name: name,
        type: 'number',
        required: false
    }
}

const account: TypeDeclaration = [
    required_string("gmail"),
    required_string("referral_code"),
]

const state: TypeDeclaration = [
    required_string("label"),
    required_string("prompt"),
    required_string("storage"),
    required_object_id('salesbot'),
    required_object('position', { x: 0, y: 0 })
]

const transition: TypeDeclaration = [
    required_object_id('state_from'),
    required_object_id('state_to'),
    required_string("condition"),
]

const salesbot: TypeDeclaration = [
    required_string('response_prompt', "You are a sales bot whose goal it is to sell a pen."),
    required_string('name'),
    required_string('simulator_prompt', "You are a bot simulating a potential customer. You are talking to a salesperson and you want to purchase a pen for the smallest price possible."),
    required_string('post_process', "return text"),
    required_string('voice_id', "21m00Tcm4TlvDq8ikWAM"),
    required_object("settings", {})
]

const chat: TypeDeclaration = [
    required_object_id('salesbot'),
    required_object('memory'),
    required_string('identifier')
]

const conversation: TypeDeclaration = [
    required_object_id('chat'),
    required_object('messages')
]

const chunk: TypeDeclaration = [
    required_number('chunk_index'),
    required_object_id('text'),
    required_string('content')
];

const text: TypeDeclaration = [
    required_string('name'),
    required_string('content'),
    required_object_id('directory')
];

const directory: TypeDeclaration = [
    required_string('method'),
    required_string('name'),
    required_object_id('salesbot')
];

const scrape: TypeDeclaration = [
    required_object_id('directory'),
    required_string("url"),
    required_boolean("is_initiated", false),
    required_boolean("is_completed", false),
    required_boolean("is_multi_url_scrape", false),
    optional_number("mrscraper_run_id"),
    optional_number("mrscraper_scraper_id"),
    optional_number("last_processed_index")
];

const reply: TypeDeclaration = [
    required_object_id('chat'),
    required_string('request'),
    required_string('response'),
    optional_string('message_id'),
    required_string('messages'),
    required_number('telegram_chat_id'),
    optional_number('duration')
]

const action: TypeDeclaration = [
    required_object_id('salesbot'),
    required_string('condition'),
    required_string('task'),
    required_object('arguments', {})
]

const received: TypeDeclaration = [
    required_string('message_id')
]

const payment: TypeDeclaration = [
    required_number('amount'),
    required_string('reference'),
    required_string('stripe_price_id'),
    optional_string('stripe_session_id'),
    required_boolean('is_paid', false),
    required_string('platform')
]

const memory_snapshot: TypeDeclaration = [
    required_object_id('salesbot'),
    required_object_id('chat'),
    required_object('memory')
]

const message_rating: TypeDeclaration = [
    required_object_id('chat'),
    required_number('message_index'),
    required_boolean('is_positive')
]

const user: TypeDeclaration = [
    required_string('email')
]

const bot_access: TypeDeclaration = [
    required_object_id('salesbot'),
    required_string('email')
]

const balance_snapshot: TypeDeclaration = [
    required_string('reference'),
    required_number('balance')
]

const scheduled_reply: TypeDeclaration = [
    required_string('text'),
    required_string('response'),
    required_number('time'),
    required_number('telegram_chat_id')
]

const message: TypeDeclaration = [
    required_object_id('chat'),
    required_string('text'),
    required_boolean('is_bot'),
    optional_number('duration')
]

const mental_notebook: TypeDeclaration = [
    required_object_id('chat'),
    required_string('text')
]

const whitelist: TypeDeclaration = [
    required_string('reference'),
    required_boolean('is_whitelisted', false)
]

const custom: TypeDeclaration = [
    required_string('name'),
    required_string('email'),
    required_string('request'),
]

const voice_upload: TypeDeclaration = [
    required_string('creator'),
    required_string('url')
]

const payout_request: TypeDeclaration = [
    required_string('creator'),
    required_number('amount'),
    required_string('method'),
    required_object('details')
]

const creator: TypeDeclaration = [
    required_string('name'),
    required_number('birth_year'),
    required_number('birth_month'),
    required_number('birth_day'),
    required_string('email'),
    required_string('residence'),
    required_string('username'),
    required_string('password'),
    required_string('instagram'),
    required_string('whatsapp'),
]

const chatbot_setup: TypeDeclaration = [
    required_string('email'),
    required_object('config')
]

const stripe_price: TypeDeclaration = [
    required_string('stripe_price_id'),
    required_string('identifier'),
    required_string('mode'),
    required_boolean('is_live', false),
    required_number('price_in_cents'),
    required_string('label'),
]

const stripe_payment: TypeDeclaration = [
    required_string('stripe_session_id'),
    required_string('stripe_price_id'),
    required_string('callback_url'),
    required_boolean('is_paid', false),
    required_object_id('account_id'),
]

const referral: TypeDeclaration = [
    required_object_id('referrer'),
    required_object_id('referred'),
]

const error: TypeDeclaration = [
    required_string('message'),
    required_string('location'),
]

export type Account = {
    gmail: string;
    referral_code: string;
} & Document;

export type Document = {
    _id: ObjectId;
    created: number;
    deleted: boolean;
};

export type Chunk = {
    content: string;
    chunk_index: number;
    text: ObjectId;
} & Document;

export type Text = {
    name: string;
    content: string;
    directory: ObjectId;
    is_original: boolean;
    is_q_and_a: boolean;
    rewrites: number;
} & Document;

export type Directory = {
    method: string;
    name: string;
    salesbot: ObjectId;
} & Document;

export type SalesBot = {
    name: string;
    response_prompt: string;
    simulator_prompt: string;
    post_process: string;
    voice_id: string;
    settings: Omit<any, "first_messages"> & {
        first_messages: { is_bot: boolean, text: string }[],
        telegram_api_key: string,
    };
} & Document;

export type BotAccess = {
    salesbot: ObjectId,
    email: string
}

export type Chat = {
    salesbot: ObjectId;
    memory: any;
    identifier: string;
} & Document;

export type Conversation = {
    chat: ObjectId;
    messages: { is_bot: boolean, text: string }[];
} & Document;

export type Reply = {
    chat: ObjectId;
    request: string;
    response: string;
    message_id?: string;
    messages: string;
    telegram_chat_id: number;
    duration?: number;
} & Document;

export type Scrape = {
    directory: ObjectId;
    url: string;
    is_initiated: boolean;
    is_completed: boolean;
    is_multi_url_scrape: boolean;
    mrscraper_scraper_id?: number;
    mrscraper_run_id?: number;
    last_processed_index?: number;
} & Document;

export type Action = {
    salesbot: ObjectId,
    condition: string;
    task: string;
    arguments: any;
} & Document;

export type Received = {
    message_id: string
} & Document;

export type Payment = {
    amount: number,
    reference: string,
    stripe_session_id?: string,
    is_paid: boolean,
    platform: string,
} & Document;

export type MemorySnapshot = {
    salesbot: ObjectId,
    chat: ObjectId;
    memory: any;
} & Document;

export type MessageRating = {
    chat: ObjectId;
    message_index: number;
    is_positive: boolean;
} & Document;

export type User = {
    email: string;
} & Document;

export type BalanceSnapshot = {
    reference: string;
    balance: number;
} & Document;

export type ScheduledReply = {
    text: string;
    response: string;
    time: number;
    telegram_chat_id: number;
} & Document;

export type Message = {
    chat: ObjectId;
    text: string;
    is_bot: boolean;
    duration?: number;
} & Document;

export type MentalNotebook = {
    chat: ObjectId;
    text: string;
} & Document;

export type Whitelist = {
    reference: string;
    is_whitelisted: boolean;
} & Document;

export type Custom = {
    name: string;
    email: string;
    request: string;
} & Document;

export type VoiceUpload = {
    creator: string;
    url: string;
} & Document;

export type PayoutRequest = {
    creator: string;
    amount: number;
    method: string;
    details: any;
} & Document;

export type Creator = {
    name: string;
    birth_year: number;
    birth_month: number;
    birth_day: number;
    email: string;
    residence: string;
    username: string;
    password: string;
    instagram: string;
    whatsapp: string;
} & Document;

export type ChatbotSetup = {
    email: string;
    config: any;
} & Document;

export type StripePrice = {
    stripe_price_id: string;
    identifier: string;
    mode: string;
    is_live: boolean;
    price_in_cents: number;
    label: string;
} & Document;

export type StripePayment = {
    account_id: ObjectId;
    stripe_session_id: string;
    stripe_price_id: string;
    callback_url: string;
    is_paid: boolean;
} & Document;

export type Referral = {
    referrer: ObjectId;
    referred: ObjectId;
} & Document;

export type Error = {
    message: string;
    location: string;
} & Document;

export const TYPE_DECLARATIONS: any = {
    account,
    state,
    chat,
    conversation,
    transition,
    salesbot,
    chunk,
    text,
    directory,
    scrape,
    reply,
    action,
    received,
    payment,
    memory_snapshot,
    message_rating,
    user,
    bot_access,
    balance_snapshot,
    scheduled_reply,
    message,
    mental_notebook,
    whitelist,
    custom,
    voice_upload,
    payout_request,
    creator,
    chatbot_setup,
    stripe_price,
    stripe_payment,
    referral,
    error,
}