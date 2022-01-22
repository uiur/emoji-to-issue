export declare class ReactionHandler {
    issueRepo: string;
    reactionName: string[] | null;
    slackToken: string;
    githubToken: string;
    constructor(params: {
        issueRepo: string;
        reactionName?: string[];
        githubToken?: string;
        slackToken?: string;
    });
    match(event: any): boolean;
    extractAssignee(reactionName: any): any;
    reactionNames(): string[];
    extractSlackUsersFromText(text: any): any[];
    removeSlackFormatting(text: any, users: any): any;
    extractSlackUsersFromMessages(messages: any): string[];
    buildIssueContent(event: any): Promise<{
        title: any;
        body: string;
    }>;
    handle(event: any): Promise<any>;
}
