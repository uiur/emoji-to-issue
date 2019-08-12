const test = require('ava')

const { ReactionHandler } = require('./')

test('event', t => {
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
