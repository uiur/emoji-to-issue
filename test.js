const test = require('ava')
const nock = require('nock')

const { ReactionHandler } = require('./')

test('handler.match()', t => {
  const event = {
    type: 'reaction_added',
    user: 'UB9T3UXU0',
    item: { type: 'message', channel: 'CGU971U2F', ts: '1565583510.003900' },
    reaction: 'issue',
    item_user: 'UB9T3UXU0',
    event_ts: '1565583513.004000'
  }

  const handler = new ReactionHandler({ issueRepo: 'hello-ai/sandbox' })
  t.true(handler.match(event))
  t.true(handler.match({ ...event, reaction: 'issue-assign-uiur' }))
  t.false(handler.match({ ...event, reaction: 'innocent' }))
})

test('handler.buildIssueContent()', async t => {
  nock('https://slack.com')
    .get(/^\/api\/channels.history/)
    .reply(200, {
      ok: true,
      messages: [
        {
          client_msg_id: '21e4c02f-0802-4981-a518-a9eb49da9876',
          type: 'message',
          text: 'issue title test',
          user: 'UB9T3UXU0',
          ts: '1565583510.003900',
          team: 'T0ZFQ4P32'
        },
        {
          client_msg_id: '642017a7-3157-49e9-b194-97493c28e91e',
          type: 'message',
          text: '<@UB9T3UXU0> user desu',
          user: 'UB9T3UXU0',
          ts: '1565581381.003500',
          team: 'T0ZFQ4P32'
        },
        {
          type: 'message',
          subtype: 'bot_message',
          text: 'bot desu',
          ts: '1565581085.003300',
          username: 'otochan-dev',
          bot_id: 'BMB12D06B'
        }
      ]
    })

  nock('https://slack.com')
    .get(/^\/api\/chat.getPermalink/)
    .reply(200, {
      ok: true,
      channel: 'CGU971U2F',
      permalink: 'https://hello-ai.slack.com/foo/bar'
    })

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

  const event = {
    type: 'reaction_added',
    user: 'UB9T3UXU0',
    item: { type: 'message', channel: 'CGU971U2F', ts: '1565583510.003900' },
    reaction: 'issue',
    item_user: 'UB9T3UXU0',
    event_ts: '1565583513.004000'
  }

  const handler = new ReactionHandler({ issueRepo: 'hello-ai/sandbox' })
  const { title, body } = await handler.buildIssueContent(event)

  t.is(title, 'issue title test')
  t.true(body.length > 0)
  t.true(body.includes('@kazato user desu'), body)
  t.false(body.includes('bot desu'))
})

test('buildIssueContent: user not found', async t => {
  nock('https://slack.com')
    .get(/^\/api\/channels.history/)
    .reply(200, {
      ok: true,
      messages: [
        {
          client_msg_id: '21e4c02f-0802-4981-a518-a9eb49da9876',
          type: 'message',
          text: '<@UB9T3UXU0> test',
          user: 'UB9T3UXU0',
          ts: '1565583510.003900',
          team: 'T0ZFQ4P32'
        }
      ]
    })

  nock('https://slack.com')
    .get(/^\/api\/chat.getPermalink/)
    .reply(200, {
      ok: true,
      channel: 'CGU971U2F',
      permalink: 'https://hello-ai.slack.com/foo/bar'
    })

  nock('https://slack.com')
    .get(/^\/api\/users\.info/)
    .reply(200, {
      ok: false,
      error: 'user_not_found'
    })

  const event = {
    type: 'reaction_added',
    user: 'UB9T3UXU0',
    item: { type: 'message', channel: 'CGU971U2F', ts: '1565583510.003900' },
    reaction: 'issue'
  }

  const handler = new ReactionHandler({ issueRepo: 'hello-ai/sandbox' })
  const { title, body } = await handler.buildIssueContent(event)

  t.true(title.includes('@UB9T3UXU0 test'), title)
  t.true(body.length > 0)
  t.true(body.includes('@UB9T3UXU0 test'), body)
  t.false(body.includes('bot desu'))
})

test('buildIssueContent: subteam', async t => {
  nock('https://slack.com')
    .get(/^\/api\/channels.history/)
    .reply(200, {
      ok: true,
      messages: [
        {
          client_msg_id: '21e4c02f-0802-4981-a518-a9eb49da9876',
          type: 'message',
          text: '<!subteam^SK0PHATT3|@hackers> test <http://example.com>',
          user: 'UB9T3UXU0',
          ts: '1565583510.003900',
          team: 'T0ZFQ4P32'
        }
      ]
    })

  nock('https://slack.com')
    .get(/^\/api\/chat.getPermalink/)
    .reply(200, {
      ok: true,
      channel: 'CGU971U2F',
      permalink: 'https://hello-ai.slack.com/foo/bar'
    })

  nock('https://slack.com')
    .get(/^\/api\/users\.info/)
    .reply(200, {
      ok: false,
      error: 'user_not_found'
    })

  const event = {
    type: 'reaction_added',
    user: 'UB9T3UXU0',
    item: { type: 'message', channel: 'CGU971U2F', ts: '1565583510.003900' },
    reaction: 'issue'
  }

  const handler = new ReactionHandler({ issueRepo: 'hello-ai/sandbox' })
  const { title, body } = await handler.buildIssueContent(event)

  t.true(title.includes('@hackers test http://example.com'), title)
  t.true(body.length > 0)
  t.true(body.includes('@hackers test'), body)
})
