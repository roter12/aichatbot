import moment from "moment";

const BODY_REQUESTS: string[] = ["POST", "PUT"] as string[];

export default async function query_api(path: string, data?: any, options?: any, is_json: boolean = true) {

    const method: string = options?.method || 'POST';

    const is_body_request = BODY_REQUESTS.includes(method);

    return fetch(
        (options?.api_path || process.env.NEXT_PUBLIC_API_PATH!)
        + (path.startsWith("/") ? path.substring(1) : path)
        + (!is_body_request && data
            ? (path.includes("?") ? "&" : "?") + 'body=' + encodeURIComponent(JSON.stringify(data))
            : '')
        , {
            method,
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                //   Authorization: "Bearer " + token,
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: is_body_request ? JSON.stringify(data) : undefined,
        })

        .then(async (response) => {

            if (is_json) {
                if (response.status === 404) {
                    throw new Error("404: API route " + path + " not found")
                }
                const json = await response.json()
                    .catch(async (error) => {
                        console.log("The following error occured in " + path + ": " + error.message);
                        const text_result = await query_api(path, data, options, false);
                        console.log("Text result:\n\n" + text_result);
                        throw new Error("An error occurred: " + error.message);
                    })
                if (!response.ok) {
                    throw new Error(json.error)
                } else {
                    return json.data
                }
            } else {
                return await response.text()
            }
        });
}