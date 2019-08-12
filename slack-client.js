const axios = require('axios')

class SlackClient {
  constructor(token, userToken) {
    this.token = token || process.env.SLACK_TOKEN
    this.userToken = userToken || process.env.SLACK_USER_TOKEN
  }

  apiHeaders(token) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }

  // channels.history api needs slack user token, not bot token
  // https://api.slack.com/custom-integrations/legacy-tokens
  async getMessages(channel, ts, count = 1) {
    const res = await axios.get('https://slack.com/api/channels.history', {
      params: {
        channel: channel,
        latest: ts,
        count: count,
        inclusive: true,
        token: this.userToken
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

  async postMessage(channel, text) {
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: channel,
        text: text
      },
      {
        headers: this.apiHeaders(this.token)
      }
    )
  }

  async getPermalink(channel, ts) {
    const res = await axios.get('https://slack.com/api/chat.getPermalink', {
      params: {
        channel: channel,
        message_ts: ts,
        token: this.token
      }
    })

    return res.data.permalink
  }

  async getUserInfo(user) {
    const res = await axios.get('https://slack.com/api/users.info', {
      params: {
        user: user,
        token: this.token
      }
    })

    if (!res.data.ok) {
      return null
    }

    return res.data.user
  }
}

module.exports = SlackClient
