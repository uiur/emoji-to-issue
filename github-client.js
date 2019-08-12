const axios = require('axios')

class GithubClient {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN
  }

  apiHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  }

  async createIssue(repo, params) {
    const res = await axios.post(
      `https://api.github.com/repos/${repo}/issues`,
      params,
      {
        headers: this.apiHeaders()
      }
    )

    if (res.status > 300) {
      console.error(res.data)
      throw new Error(res.data.message)
    }

    return res.data
  }

  async getLatestIssues(repo) {
    const res = await axios.get(`https://api.github.com/repos/${repo}/issues`, {
      params: {
        state: 'all'
      },
      headers: this.apiHeaders()
    })

    if (res.status > 300) {
      console.error(res.data)
      throw new Error(res.data.message)
    }

    return res.data
  }
}

module.exports = GithubClient
