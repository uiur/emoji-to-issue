const decode = require('decode-html')
const GithubClient = require('./github-client')
const SlackClient = require('./slack-client')

function debug(message) {
  if (process.env.DEBUG) {
    console.log(message)
  }
}

class ReactionHandler {
  // @param {Object} params
  // @example
  // handler = new ReactionHandler({
  //   reactionName: ['issue'],  // default: ['issue', 'issue-assign_:assignee']
  //   issueRepo: 'hello-ai/sandbox',
  //   slackToken: process.env.SLACK_TOKEN,
  //   slackUserToken: process.env.SLACK_USER_TOKEN,
  //   githubToken: process.env.GITHUB_TOKEN
  // })
  constructor(params) {
    this.params = params
    this.issueRepo = params.issueRepo
    this.reactionName = params.reactionName
    this.slackToken = params.slackToken || process.env.SLACK_TOKEN
    this.slackUserToken = params.slackUserToken || process.env.SLACK_USER_TOKEN
    this.githubToken = params.githubToken || process.env.GITHUB_TOKEN
  }

  // @return {boolean}
  match(event) {
    return (
      event.type === 'reaction_added' &&
      this.reactionNames().includes(event.reaction)
    )
  }

  reactionNames() {
    return this.reactionName || ['issue', 'イシュー']
  }

  // create an issue from a slack reaction event
  // @return {Promise}
  async handle(event) {
    if (!this.match(event)) return

    const issueRepo = this.issueRepo

    const slackClient = new SlackClient(this.slackToken, this.slackUserToken)

    const { channel, ts } = event.item
    const { messages } = await slackClient.getMessages(channel, ts, 10)
    debug(messages)
    const message = messages[0]
    const permalink = await slackClient.getPermalink(channel, message.ts)

    const title = decode(message.text)
    const historyText = messages
      .reverse()
      .filter(m => m.type === 'message')
      .map(m => decode(m.text))
      .join('\n')

    const body = `${permalink}\n` + '```\n' + historyText + '\n```'

    const githubClient = new GithubClient(this.githubToken)

    const issues = await githubClient.getLatestIssues(issueRepo)
    const foundIssue = issues.find(issue => {
      return issue.title === title
    })

    if (foundIssue) {
      return
    }

    const issue = await githubClient.createIssue(issueRepo, {
      title: title,
      body: body
    })

    const slackMessage = `<@${event.user}> ${issue.html_url}`
    await slackClient.postMessage(channel, slackMessage)
  }
}

exports.ReactionHandler = ReactionHandler
