import upload_file from '@/utils/upload_file';
import wrap_api_function from '@/utils/wrap_api_function';

async function execute(body: any) {
    return await upload_file(body.path);
}

export default wrap_api_function(execute);