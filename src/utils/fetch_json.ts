export async function fetch_json_post(url: string, body: any, bearer_token: string) {

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + bearer_token,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(body)
    });

    // Clone the response to prevent the content from being consumed.
    const clonedResponse = response.clone();

    try {
        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Failed to parse JSON response. Text response:");
        const text = await clonedResponse.text();
        console.error(text);
        throw error;
    }
}

export async function fetch_json_get(url: string, bearer_token: string) {

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + bearer_token,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    const json = await response.json();
    return json;
}