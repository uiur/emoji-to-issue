const test = require('ava')
const nock = require('nock')
const uuidv4 = require('uuid').v4

const { ReactionHandler } = require('./')

function mockSlackHistory(messages) {
  nock('https://slack.com')
    .get(/^\/api\/channels.history/)
    .reply(200, {
      ok: true,
      messages
    })
}

function slackMessage(text) {
  return {
    client_msg_id: uuidv4(),
    type: 'message',
    text: text,
    user: 'UB9T3UXU0',
    ts: Date.now() / 1000,
    team: 'T0ZFQ4P32'
  }
}

function slackBotMessage(text) {
  return {
    type: 'message',
    subtype: 'bot_message',
    text: text,
    ts: Date.now() / 1000,
    username: 'otochan-dev',
    bot_id: 'BMB12D06B'
  }
}

function slackReactionAddedEvent() {
  return {
    type: 'reaction_added',
    user: 'UB9T3UXU0',
    item: { type: 'message', channel: 'CGU971U2F', ts: '1565583510.003900' },
    reaction: 'issue',
    item_user: 'UB9T3UXU0',
    event_ts: '1565583513.004000'
  }
}

test('handler.match()', t => {
  const event = slackReactionAddedEvent()

  const handler = new ReactionHandler({ issueRepo: 'hello-ai/sandbox' })
  t.true(handler.match(event))
  t.true(handler.match({ ...event, reaction: 'issue-assign-uiur' }))
  t.false(handler.match({ ...event, reaction: 'innocent' }))
})

test.beforeEach(() => {
  nock('https://slack.com')
    .get(/^\/api\/chat.getPermalink/)
    .reply(200, {
      ok: true,
      channel: 'CGU971U2F',
      permalink: 'https://hello-ai.slack.com/foo/bar'
    })
})

test('handler.buildIssueContent()', async t => {
  mockSlackHistory([
    slackMessage('issue title test'),
    slackMessage('<@UB9T3UXU0> user desu'),
    slackBotMessage('bot desu')
  ])

  nock('https://slack.com')
    .get(/^\/api\/users\.info/)
    .reply(200, {
      ok: true,
      user: {
        id: 'UB9T3UXU0',
        team_id: 'T0ZFQ4P32',
        real_name: 'Kazato Sugimoto',
        profile: {
          title: '',
          display_name: 'kazato',
          display_name_normalized: 'kazato'
        }
      }
    })

  const event = slackReactionAddedEvent()

  const handler = new ReactionHandler({ issueRepo: 'hello-ai/sandbox' })
  const { title, body } = await handler.buildIssueContent(event)

  t.is(title, 'issue title test')
  t.true(body.length > 0)
  t.true(body.includes('@kazato user desu'), body)
  t.false(body.includes('bot desu'))
})

test('buildIssueContent: user not found', async t => {
  mockSlackHistory([slackMessage('<@UB9T3UXU0> test')])

  nock('https://slack.com')
    .get(/^\/api\/users\.info/)
    .reply(200, {
      ok: false,
      error: 'user_not_found'
    })

  const event = slackReactionAddedEvent()

  const handler = new ReactionHandler({ issueRepo: 'hello-ai/sandbox' })
  const { title, body } = await handler.buildIssueContent(event)

  t.true(title.includes('@UB9T3UXU0 test'), title)
  t.true(body.length > 0)
  t.true(body.includes('@UB9T3UXU0 test'), body)
  t.false(body.includes('bot desu'))
})

test('buildIssueContent: subteam', async t => {
  mockSlackHistory([
    slackMessage('<!subteam^SK0PHATT3|@hackers> test <http://example.com>')
  ])

  nock('https://slack.com')
    .get(/^\/api\/users\.info/)
    .reply(200, {
      ok: false,
      error: 'user_not_found'
    })

  const event = slackReactionAddedEvent()

  const handler = new ReactionHandler({ issueRepo: 'hello-ai/sandbox' })
  const { title, body } = await handler.buildIssueContent(event)

  t.true(title.includes('@hackers test http://example.com'), title)
  t.true(body.length > 0)
  t.true(body.includes('@hackers test'), body)
})
