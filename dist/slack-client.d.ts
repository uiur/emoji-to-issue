export default class SlackClient {
    token: string;
    constructor(token: any);
    apiHeaders(token: any): {
        'Content-Type': string;
        Authorization: string;
    };
    getMessages(channel: any, ts: any, count?: number): Promise<any>;
    postMessage(channel: any, text: any): Promise<void>;
    getPermalink(channel: any, ts: any): Promise<any>;
    getUserInfo(user: any): Promise<any>;
}
