export default async function query_api_with_formdata(path: string, form_data: any) {
    const token = 'abc';

    return fetch(process.env.NEXT_PUBLIC_API_PATH! + (path.startsWith('/') ? path.substring(1) : path), {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'include',
        headers: {
            Authorization: 'Bearer ' + token
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: form_data
    }).then(async (response) => {
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.error);
        } else {
            return json;
        }
    });
}
