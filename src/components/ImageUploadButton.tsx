import query_api from "@/utils/query_api";
import query_api_with_formdata from "@/utils/query_api_with_formdata";
import { Input } from "@nextui-org/react";
import { useState } from "react";
import LoadingScreen from "./LoadingScreen";
import { display_error } from "@/utils/notifications";

async function upload_file(file: File) {
    const FormData = require('form-data');
    const form = new FormData();

    const blob = new Blob([file], { type: file.type });
    const filename = file.name;
    form.append('file', blob, filename);

    // random hash
    const temp_filename =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.' + filename.split('.').pop();

    await query_api_with_formdata('/file/upload?filename=' + temp_filename, form)
    const url = await query_api("file/upload_do", { path: '/tmp/' + temp_filename });
    await query_api("send_photo", { url, salesbot_id: "64c3c71b0338812081391c5e" });
}

export default function ImageUploadButton({ on_success }: { on_success: () => any }) {

    const [is_uploading, set_is_uploading] = useState(false)


    async function on_files_selected() {
        const files: File[] = document.forms['file_upload_form' as any]['files'].files;

        if (files.length === 0) {
            display_error('No files selected');
            return;
        }

        set_is_uploading(true);

        for (const file of files) {
            await upload_file(file)
                .then((temp_filename) => {
                    document.forms['file_upload_form' as any]['files'].value = '';
                    on_success();
                })
                .catch(display_error);
        }
        set_is_uploading(false);
    }

    return <form name={"file_upload_form"} className="my-10">
        <LoadingScreen show={is_uploading} />
        <Input style={{ paddingTop: '7px', width: '300px' }} type="file" accept=".png,.jpg,.jpeg," id="files" multiple={true} onChange={on_files_selected} />
    </form>
}