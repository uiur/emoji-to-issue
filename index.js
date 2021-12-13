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
  //   reactionName: ['issue'],  // default: ['issue', 'issue-assign-:assignee']
  //   issueRepo: 'hello-ai/sandbox',
  //   slackToken: process.env.SLACK_TOKEN,
  //   githubToken: process.env.GITHUB_TOKEN
  // })
  constructor(params) {
    this.params = params
    this.issueRepo = params.issueRepo
    this.reactionName = params.reactionName
    this.slackToken = params.slackToken || process.env.SLACK_TOKEN
    this.githubToken = params.githubToken || process.env.GITHUB_TOKEN
  }

  // @return {boolean}
  match(event) {
    if (event.type !== 'reaction_added') return false
    if (this.reactionNames().includes(event.reaction)) return true

    const matched = this.reactionNames().some(name => {
      return new RegExp(`^${name}-assign-.+$`).test(event.reaction)
    })

    return matched
  }

  extractAssignee(reactionName) {
    const matchData = reactionName.match(/-assign-(.+)$/)
    return matchData && matchData[1]
  }

  reactionNames() {
    return this.reactionName || ['issue', 'イシュー']
  }

  extractSlackUsersFromText(text) {
    const result = []
    const regex = /<@([^>]+)>/g
    let matched
    while ((matched = regex.exec(text)) !== null) {
      result.push(matched[1])
    }

    return result
  }

  removeSlackFormatting(text, users) {
    return text.replace(
      /<([@#!])?([^>|]+)(?:\|([^>]+))?>/g,
      (match, type, link, label) => {
        if (type === '@') {
          const info = users[link]
          if (info) {
            return `@${info.profile.display_name}`
          } else {
            return `@${link}`
          }
        }

        if (type === '#') {
          return `#${label || link}`
        }

        return label || link
      }
    )
  }

  extractSlackUsersFromMessages(messages) {
    const users = {}
    messages
      .filter(m => m.user)
      .forEach(m => {
        users[m.user] = null
      })

    messages.forEach(m => {
      this.extractSlackUsersFromText(m.text).forEach(u => {
        users[u] = null
      })
    })

    return Object.keys(users)
  }

  async buildIssueContent(event) {
    const slackClient = new SlackClient(this.slackToken)

    const { channel, ts } = event.item
    const { messages } = await slackClient.getMessages(channel, ts, 10)

    const slackUsers = this.extractSlackUsersFromMessages(messages)

    const userInfos = await Promise.all(
      slackUsers.map(user => slackClient.getUserInfo(user))
    )

    const users = {}
    userInfos.forEach(info => {
      if (!info) return
      users[info.id] = info
    })

    debug(messages)
    const message = messages[0]
    const permalink = await slackClient.getPermalink(channel, message.ts)

    const title = this.removeSlackFormatting(decode(message.text), users)
    const historyText = messages
      .reverse()
      .filter(
        m =>
          m.type === 'message' &&
          m.subtype !== 'bot_message' &&
          m.bot_id === undefined &&
          m.text
      )
      .map(m => {
        const info = users[m.user]
        const username = info ? info.profile.display_name : m.user
        const decoded = decode(m.text)
        const expanded = this.removeSlackFormatting(decoded, users)
        return `${username}: ${expanded}`
      })
      .join('\n')

    const body = `${permalink}\n` + '```\n' + historyText + '\n```'

    return {
      title: title,
      body: body
    }
  }

  // create an issue from a slack reaction event
  // @return {Promise}
  async handle(event) {
    debug(event)
    if (!this.match(event)) return

    const { title, body } = await this.buildIssueContent(event)
    const githubClient = new GithubClient(this.githubToken)

    const issueRepo = this.issueRepo
    const issues = await githubClient.getLatestIssues(issueRepo)
    const foundIssue = issues.find(issue => {
      return issue.title === title
    })

    if (foundIssue) {
      return foundIssue
    }

    const issueParams = {
      title: title,
      body: body
    }

    const assignee = this.extractAssignee(event.reaction)
    if (assignee) {
      issueParams.assignees = [assignee]
    }

    debug(issueParams)
    const issue = await githubClient.createIssue(issueRepo, issueParams)

    const { channel } = event.item
    const slackClient = new SlackClient(this.slackToken)
    const slackMessage = `<@${event.user}> ${issue.html_url}`
    await slackClient.postMessage(channel, slackMessage)

    return issue
  }
}

exports.ReactionHandler = ReactionHandler
