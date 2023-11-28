import { convert_audio, convert_mp3_to, convert_text_to_speech } from "salesbot_audio";
import upload_file from "./upload_file";
import IMessagingPlatform from "./interfaces/messaging_platform";
import * as mm from 'music-metadata';
import { execute_mongo_post } from "@/pages/api/[collection]";
import { COLLECTION } from "./query_api_method";
import log_error from "./log_error";


function path_to_extension(path: string, extension: string) {
    if (!extension.startsWith(".")) {
        extension = "." + extension;
    }
    return path.replace(/\.[^/.]+$/, extension);
}

async function get_length_of_audio_file(path: string) {
    return mm.parseFile(path)
        .then(metadata => metadata.format.duration);
}

function log_time(start_time: number, message: string) {
    const end_time = Date.now();
    console.log("... " + message, end_time - start_time);
}

export default async function send_voice_via_telegram_nonbot({ platform_chat_id, voice_platform_api_key, messenger, voice_id, voice_platform, text, voice_speed }
    : { platform_chat_id: string, messenger: IMessagingPlatform, voice_platform_api_key: string, voice_platform: "elevenlabs" | "coqui", voice_id: string, text: string, voice_speed: number }) {
    const start_time = Date.now();
    const api_key = voice_platform === "coqui" ? process.env.COQUI_API_KEY! : voice_platform_api_key
    let path = "";
    try {
        path = await convert_text_to_speech(voice_platform, api_key, voice_id, text);
    } catch (error: any) {
        await messenger.send_text(text, platform_chat_id + "");
        // log error
        await log_error(error);
        return 0;
    }
    log_time(start_time, "convert_text_to_speech");
    const path_oga = path.endsWith(".mp3")
        ? await convert_mp3_to(path, "ogg", { speed: voice_speed })
        : await convert_audio(path, path_to_extension(path, "ogg"), { speed: voice_speed })
            // .then(() => rename_file(path_to_extension(path, "ogg"), path_to_extension(path, "oga")))
            .then(() => path_to_extension(path, "ogg"))
    log_time(start_time, "convert_audio");
    const file_url = await upload_file(path_oga);
    await messenger.send_audio(file_url, platform_chat_id + "");
    log_time(start_time, "send_audio");
    await new Promise(resolve => setTimeout(resolve, 2000));
    const response_audio_duration = await get_length_of_audio_file(path) as number;
    return response_audio_duration;
}