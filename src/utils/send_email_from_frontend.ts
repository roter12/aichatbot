import query_api from "./query_api";

export default async function send_email_from_frontend(
    content: string,
) {
    return await query_api("send_email", {
        text: content
    })
}