import wrap_api_function from "@/utils/wrap_api_function";
import { execute_mongo_get } from "./[collection]";
import { Error } from "./[collection]/schemas";
import moment from "moment";
import send_email from "./utils/send_email";
import { COLLECTION } from "@/utils/query_api_method";

export default wrap_api_function(execute);

async function execute(body: any) {
    const created_min = moment().subtract(1, "hour").unix();
    const errors = await execute_mongo_get(COLLECTION.ERROR, { created: { $gte: created_min } }, true) as Error[];
    if (errors.length > 0) {
        send_email(`${errors.length} ChatVIP Errors`, `${ errors.length } errors occurred in the last hour.
            ${ errors.map(error => error.message).join("\n") }`, process.env.ADMIN_EMAIL!);
    }
}