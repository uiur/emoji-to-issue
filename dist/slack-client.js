'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const axios_1 = __importDefault(require('axios'))
class SlackClient {
  constructor(token) {
    this.token = token || process.env.SLACK_TOKEN
  }
  apiHeaders(token) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }
  getMessages(channel, ts, count = 1) {
    return __awaiter(this, void 0, void 0, function*() {
      const res = yield axios_1.default.get(
        'https://slack.com/api/conversations.history',
        {
          params: {
            channel: channel,
            latest: ts,
            limit: count,
            inclusive: true
          },
          headers: this.apiHeaders(this.token)
        }
      )
      if (res.status > 300) {
        console.error(res.data)
        throw new Error(res.data.message)
      }
      if (!res.data.ok) {
        console.error(res.data)
        throw new Error(JSON.stringify(res.data))
      }
      return res.data
    })
  }
  postMessage(channel, text) {
    return __awaiter(this, void 0, void 0, function*() {
      yield axios_1.default.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channel,
          text: text
        },
        {
          headers: this.apiHeaders(this.token)
        }
      )
    })
  }
  getPermalink(channel, ts) {
    return __awaiter(this, void 0, void 0, function*() {
      const res = yield axios_1.default.get(
        'https://slack.com/api/chat.getPermalink',
        {
          params: {
            channel: channel,
            message_ts: ts,
            token: this.token
          }
        }
      )
      return res.data.permalink
    })
  }
  getUserInfo(user) {
    return __awaiter(this, void 0, void 0, function*() {
      if (!user) {
        throw new Error('user is null')
      }
      const res = yield axios_1.default.get(
        'https://slack.com/api/users.info',
        {
          params: {
            user: user,
            token: this.token
          }
        }
      )
      if (!res.data.ok) {
        return null
      }
      return res.data.user
    })
  }
}
exports.default = SlackClient
