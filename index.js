const axios = require('axios')
const decode = require('decode-html')

function apiHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

// channels.history api needs slack user token, not bot token
// https://api.slack.com/custom-integrations/legacy-tokens
async function getMessages(channel, ts, count = 1) {
  const token = process.env.SLACK_USER_TOKEN

  const res = await axios.get('https://slack.com/api/channels.history', {
    params: {
      channel: channel,
      latest: ts,
      count: count,
      inclusive: true,
      token: token
    }
  })

  if (res.status > 300) {
    console.error(res.data)
    throw new Error(res.data.message)
  }

  if (!res.data.ok) {
    console.error(res.data)
    throw new Error(JSON.stringify(res.data))
  }

  return res.data
}

async function postMessage(channel, text) {
  const token = process.env.SLACK_TOKEN

  await axios.post(
    'https://slack.com/api/chat.postMessage',
    {
      channel: channel,
      text: text,
      icon_emoji: ':chicken:'
    },
    {
      headers: apiHeaders(token)
    }
  )
}

async function getPermalink(channel, ts) {
  const res = await axios.get('https://slack.com/api/chat.getPermalink', {
    params: {
      channel: channel,
      message_ts: ts,
      token: process.env.SLACK_TOKEN
    }
  })

  return res.data.permalink
}

function githubApiHeaders() {
  return {
    ...apiHeaders(process.env.GITHUB_TOKEN),
    Accept: 'application/vnd.github.v3+json'
  }
}

async function createIssue(repo, params) {
  const res = await axios.post(
    `https://api.github.com/repos/${repo}/issues`,
    params,
    {
      headers: githubApiHeaders()
    }
  )

  if (res.status > 300) {
    console.error(res.data)
    throw new Error(res.data.message)
  }

  return res.data
}

async function getLatestIssues(repo) {
  const res = await axios.get(`https://api.github.com/repos/${repo}/issues`, {
    params: {
      state: 'all'
    },
    headers: githubApiHeaders()
  })

  if (res.status > 300) {
    console.error(res.data)
    throw new Error(res.data.message)
  }

  return res.data
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
  }

  // @return {boolean}
  match(event) {
    return event.type === 'reaction_added' && event.reaction === 'イシュー'
  }

  // create an issue from a slack reaction event
  // @return {Promise}
  async handle(event) {
    if (!this.match(event)) return

    const issueRepo = this.issueRepo

    const { channel, ts } = event.item
    const { messages } = await getMessages(channel, ts, 10)
    console.log(messages)
    const message = messages[0]
    const permalink = await getPermalink(channel, message.ts)

    const title = decode(message.text)
    const historyText = messages
      .reverse()
      .filter(m => m.type === 'message')
      .map(m => decode(m.text))
      .join('\n')

    const body = `${permalink}\n` + '```\n' + historyText + '\n```'

    const issues = await getLatestIssues(issueRepo)
    const foundIssue = issues.find(issue => {
      return issue.title === title
    })

    if (foundIssue) {
      return
    }

    const issue = await createIssue(issueRepo, { title: title, body: body })

    const slackMessage = `<@${event.user}> ${issue.html_url}`
    await postMessage(channel, slackMessage)
  }
}

exports.ReactionHandler = ReactionHandler
