import Button from "../Button";
import { useState } from "react";
import ProgressWindow from "./ProgressWindow";
import { Box } from "../Box";
import { Loading } from "@nextui-org/react";
import DataUploadButton from "@/components/DataUploadButton";
import { COLLECTION, mongo_post } from "@/utils/query_api_method";
import { display_success } from "@/utils/notifications";
import useGet from "@/utils/hooks/useGet";
import { VoiceUpload } from "@/pages/api/[collection]/schemas";
import query_api from "@/utils/query_api";
import Textarea from "../Textarea";

const VoiceUpload = ({ creator }: { creator: string }) => {

    const { data: voice_uploades, is_loading, reload } = useGet<VoiceUpload[]>(COLLECTION.VOICE_UPLOAD, { creator }, true, false);

    return <Box>
        <h1 className="text-3xl font-bold">Voice Upload</h1>
        {
            is_loading
                ? <Loading />
                : voice_uploades?.map(({ url }, index) => {
                    const extension = url.split(".").pop();
                    return <audio controls key={"audio_" + index}>
                        <source src={url} type={
                            extension === "wav"
                                ? "audio/wav"
                                : extension === "mp3"
                                    ? "audio/mpeg"
                                    : extension === "mp4"
                                        ? "audio/mp4"
                                        : extension === "mov"
                                            ? "audio/quicktime"
                                            : ""
                        } />
                    </audio>
                })
        }
        <DataUploadButton
            id="voice"
            accepted_extensions={[".wav", ".mp3", ".mp4", ".mov"]}
            on_success={async (paths) => {
                const upload_promises = paths.map(path => query_api("file/upload_do", { path }));
                const do_paths = await Promise.all(upload_promises);
                await mongo_post(COLLECTION.VOICE_UPLOAD, do_paths.map(path => ({ creator, url: path })));
                reload();
                display_success("File uploaded!");
            }} />
    </Box>
}

const VoiceWindow = ({ on_back, on_next, percentage }: { on_back: Function, on_next: Function, percentage: number }) => {

    const [languages, set_languages] = useState("");

    const data = {
        languages
    };

    return <ProgressWindow title=" Great, now let&apos;s train your AI with some data about you. This is just a start, so don&apos;t think too hard about it, just surface-level stuff." percentage={percentage}>

        <div>Please upload a sample of your voice here:</div>
        <VoiceUpload creator={""} />

        <div>Which languages would you like your bot to speak in? </div>
        <div className="text-black/50">We typically keep it to the languages you know as an individual, but if you are interested in your AI personality communicating to fans in additional languages, please note them here. </div>
        <Textarea value={languages} set_value={set_languages} />

        <div className="text-right">
            <Button color="white" onClick={on_back}>Back</Button>
            <Button className="ml-2" onClick={() => on_next(data)}>Next</Button>
        </div>
    </ProgressWindow>
}

export default VoiceWindow;