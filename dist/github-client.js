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
  createIssue(repo, params) {
    return __awaiter(this, void 0, void 0, function*() {
      const res = yield axios_1.default.post(
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
    })
  }
  getLatestIssues(repo) {
    return __awaiter(this, void 0, void 0, function*() {
      const res = yield axios_1.default.get(
        `https://api.github.com/repos/${repo}/issues`,
        {
          params: {
            state: 'all'
          },
          headers: this.apiHeaders()
        }
      )
      if (res.status > 300) {
        console.error(res.data)
        throw new Error(res.data.message)
      }
      return res.data
    })
  }
}
exports.default = GithubClient
