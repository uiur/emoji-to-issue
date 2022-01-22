import axios from 'axios'

export default class SlackClient {
  token: string
  constructor(token) {
    this.token = token || process.env.SLACK_TOKEN
  }

  apiHeaders(token) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }

  async getMessages(channel, ts, count = 1) {
    const res = await axios.get('https://slack.com/api/conversations.history', {
      params: {
        channel: channel,
        latest: ts,
        limit: count,
        inclusive: true
      },
      headers: this.apiHeaders(this.token)
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
    if (!user) {
      throw new Error('user is null')
    }

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
