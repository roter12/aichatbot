import wrap_api_function from "@/utils/wrap_api_function";
import send_email from "./utils/send_email";

export default wrap_api_function(execute);

async function execute(body: any) {
    const { text } = body;
    await send_email("ChatVIP Application", text, process.env.ADMIN_EMAIL!);
    console.log("Sent email", text);
}