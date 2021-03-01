# emoji-to-issue

The fastest way to create GitHub issues on your phone.

Add emoji reactions to messages on Slack and it creates an GitHub issue for you.

If you don't make it an isssue, you'll forget it. Don't miss problems of your product.
This module helps you to accelerate product development process, especially when you're dog-fooding.

## usage

Add an emoji reaction:

![](https://i.gyazo.com/d18f953b3857dd5a2f84fcc347f46170.png)

Then, the issue is made:
![](https://i.gyazo.com/16499ff7e05e42a16895e1f46e6e76a3.png)

## setup

In your `package.json`:

```js
"dependencies": {
  "emoji-to-issue": "uiur/emoji-to-issue#master",
```

Then:

```
npm install
```

### configure slack emoji

https://slack.com/customize/emoji

Add custom emoji with names such as `:issue:` or `:issue-assign-uiur:`.
Use alias if you want short one like: `:uiu: -> :issue-assign-uiur:`

This emoji generator is useful: https://emoji-gen.ninja/

### write some code

Following api tokens are required:

- `SLACK_TOKEN`
  - slack bot token
  - Bot User OAuth Access Token `https://api.slack.com/apps/~~/install-on-team`
  - Enable Events and add subscription to `reaction added` events https://api.slack.com/apps/:app/event-subscriptions
  - Permissions: `channels:history` `users:read` https://api.slack.com/apps/:app/oauth
- `GITHUB_TOKEN`
  - https://github.com/settings/tokens

Set those tokens via environment variables or pass it to the arguments.

```js
const { ReactionHandler } = require('emoji-to-issue')

handler = new ReactionHandler({
  issueRepo: 'hello-ai/sandbox', // required
  reactionName: ['bug'], // default: 'issue', 'issue-assign_:assignee' etc.
  slackToken: 'bot token', // default: process.env.SLACK_TOKEN
  githubToken: 'github token' // default: process.env.GITHUB_TOKEN
})

// event = {
//   type: 'reaction_added',
//   user: 'UB9T3UXU0',
//   item: { type: 'message', channel: 'CGU971U2F', ts: '1565583510.003900' },
//   reaction: 'issue',
//   item_user: 'UB9T3UXU0',
//   event_ts: '1565583513.004000'
// }

if (handler.match(event)) {
  handler
    .handle(event)
    .then(() => {
      console.log('ok')
    })
    .catch(err => {
      console.error(err)
    })
}
```
