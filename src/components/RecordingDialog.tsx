import { Button } from "@nextui-org/react";
import Dialog from "./Dialog";
import moment from "moment";
import { useEffect, useState } from "react";
import { Progress } from "./new/windows/ProgressWindow";
import RECORDING_SCRIPT from "../../public/record_script.json";
import AudioRecorder from "./AudioRecorder";
import query_api_with_formdata from "@/utils/query_api_with_formdata";

const RecordingDialog = ({on_success }: { on_success: (paths: string[]) => any }) => {

    async function upload_file(audio: Blob) {
        const FormData = require('form-data');
        const form = new FormData();

        const filename = "recording.wav"
        form.append('file', audio, filename);

        // random hash
        const temp_filename =
            Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.' + filename.split('.').pop();

        await query_api_with_formdata('/file/upload?filename=' + temp_filename, form);
        await on_success(['/tmp/' + temp_filename]);
        set_timestamp_start(999999999999999);
        set_is_open(false);
    }

    const [is_open, set_is_open] = useState(false);
    const [timestamp_start, set_timestamp_start] = useState(999999999999999);
    const [timestamp_now, set_timestamp_now] = useState(0);

    async function onRecordingStart() {
        set_timestamp_start(moment().unix());
    }

    // rerender every second
    useEffect(() => {
        const interval = setInterval(() => {
            set_timestamp_now(moment().unix());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const duration = timestamp_now - timestamp_start;
    const DURATION_IN_SECONDS = 30 * 60;
    const percentage = Math.max(0, Math.min(100, duration / DURATION_IN_SECONDS * 100));

    const CHARACTERS_PER_MINUTE = 600;
    const CHARACTERS_PER_SECOND = CHARACTERS_PER_MINUTE / 60;
    const characters_read = Math.floor(duration * CHARACTERS_PER_SECOND);

    const position_in_script = Math.min(RECORDING_SCRIPT.text.length, characters_read);
    const position_in_script_word_adjusted = RECORDING_SCRIPT.text.indexOf(" ", position_in_script);
    const text_read = RECORDING_SCRIPT.text.slice(0, position_in_script_word_adjusted);
    const text_remaining = RECORDING_SCRIPT.text.slice(position_in_script_word_adjusted);

    return <>
        <Dialog title='Recording' is_open={is_open} close={() => set_is_open(false)}>
            <p>Try to speak as though you are conversing with someone ~using natural speech~ as opposed to using your reading voice 😉</p>
            <Progress percentage={percentage} />
            <div className="text-[20px] border p-3 rounded-md bg-black/5 overflow-y-scroll max-h-[400px]">
                <label>{text_read}</label>
                <label className='text-black/30'>{text_remaining}</label>
            </div>
            <AudioRecorder duration_in_seconds={DURATION_IN_SECONDS} onFinish={upload_file} onRecordingStart={onRecordingStart} />
        </Dialog>
        <Button onClick={() => set_is_open(true)}>Record</Button>
    </>

}

export default RecordingDialog;