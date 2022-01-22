export default class GithubClient {
  token: string
  constructor(token: any)
  apiHeaders(): {
    'Content-Type': string
    Authorization: string
    Accept: string
  }
  createIssue(repo: any, params: any): Promise<any>
  getLatestIssues(repo: any): Promise<any>
}
