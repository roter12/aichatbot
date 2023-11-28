import IMessagingPlatform from "./messaging_platform";

class Instagram implements IMessagingPlatform {

    private api_key: string;
    private page_id: string;

    constructor(api_key: string, page_id: string) {
        this.api_key = api_key;
        this.page_id = page_id;
    }

    private async _query_meta_graph_api(route: string, method: string, body: any): Promise<any> {

        const response = await fetch(`https://graph.facebook.com/v17.0/` + route + (route.includes("?") ? "&" : "?") + "access_token=" + this.api_key,
            {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify(body)
            });
        return await response.json();
    }

    async send_audio(url_to_audio: any, user_id: string): Promise<boolean> {
        //        curl -i -X POST -H "Content-Type: application/json" -d "{\"recipient\":{\"id\":\"7339103039440421\"}, \"message\":{\"attachment\":{\"type\":\"audio\",\"payload\":{\"url\":\"https://getsamplefiles.com/download/m4a/sample-3.m4a\"}}}, \"access_token\":\"EAASzDUwJEz4BALpBtnFIKsBfzaitIfHeZBxeIm5xuFG26Xlcg6ZCbrx7zLo22goqWmG8dUNdxjenEhbZB8qcFqMbeAHJlZCj16fURAf8P1ghI36YlZBSJarStZAPY81eHEb1zzWtnFTgL1NtzfNfhZBlAhG0xF9cHdqPbsS7MgZCgJxo4ZBTe7q0OVh7mvlTgCW9NUfSXyXPrAoljj4FjrHDh\"}" "https://graph.facebook.com/v17.0/115368051614997/messages"
        return await this._query_meta_graph_api("me/messages", "POST", {
            recipient: {
                id: user_id
            },
            message: {
                attachment: {
                    type: "audio",
                    payload: {
                        url: url_to_audio
                    },
                },
            },
        });
    }


    async send_text(text: string, user_id: string): Promise<boolean> {
        // curl -i -X POST "https://graph.facebook.com/v17.0/me/messages?access_token=EAASzDUwJEz4BAHhhCZAtGrfMLG7jtAPqJ4qRyNhmXh1tXLr9nVIeROURsMvLmehWpwISeGzwn3WQbewNph6PTPa6NTOI8Q8PkHFZCP04aULlT8Jb4OFuWq51SUojDG8and4slYNN55jyQ2Xv968rQDEyYES57nUNw4RzLDenJ42UdCkGJZCJJa4v8i2uvbp0sYS5ih5T8sfvxkHDE9A" --data 'recipient={"id":"7339103039440421"}&message={"text":"Get ready for the habanero ;)"}'
        return await this._query_meta_graph_api("me/messages", "POST", {
            recipient: {
                id: user_id
            },
            message: {
                text
            }
        });
    }

    async send_image(url_to_image: string, user_id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async init(config: { receive_url: string }): Promise<any> {

    }
}

export default Instagram;