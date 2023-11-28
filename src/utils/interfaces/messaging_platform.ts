export default interface IMessagingPlatform {

    init: (config: any) => Promise<any>;
    send_text: (message: string, receiver: string) => Promise<boolean>;
    send_audio: (url_to_audio: string, receiver: string) => Promise<boolean>;
    send_image: (url_to_image: string, receiver: string) => Promise<boolean>;
}
