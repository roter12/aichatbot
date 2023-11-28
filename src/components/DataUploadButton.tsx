import { display_error } from "@/utils/notifications";
import query_api_with_formdata from "@/utils/query_api_with_formdata";
import { Input } from "@nextui-org/react";
import { useState } from "react";
import LoadingScreen from "./LoadingScreen";

async function upload_file(file: File) {
    const FormData = require('form-data');
    const form = new FormData();

    const blob = new Blob([file], { type: file.type });
    const filename = file.name;
    form.append('file', blob, filename);

    // random hash
    const temp_filename =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.' + filename.split('.').pop();

    await query_api_with_formdata('/file/upload?filename=' + temp_filename, form);
    return '/tmp/' + temp_filename;
}

export default function DataUploadButton({ id, on_success, accepted_extensions }: { id: string, on_success: (paths: string[]) => any, accepted_extensions: string[] }) {

    const [is_loading, set_is_loading] = useState(false)

    async function on_files_selected() {
        const files: File[] = document.forms['file_upload_form_' + id as any]['files'].files;

        if (files.length === 0) {
            display_error('No files selected');
            return;
        }

        set_is_loading(true);

        const paths: string[] = [];

        for (const file of files) {
            await upload_file(file)
                .then((path) => paths.push(path))
                .catch(display_error);
        }
        document.forms['file_upload_form_' + id as any]['files'].value = '';
        on_success(paths)
            .finally(() => set_is_loading(false))
    }

    return <form name={"file_upload_form_" + id}>
        <LoadingScreen show={is_loading} />
        <Input style={{ paddingTop: '7px', width: '300px' }} type="file" accept={accepted_extensions.join(",")} id="files" multiple={true} onChange={on_files_selected} />
    </form>
}