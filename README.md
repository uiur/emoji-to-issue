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

```js
const { ReactionHandler } = require('emoji-to-issue')

// event = {
//   type: 'reaction_added',
//   user: 'UB9T3UXU0',
//   item: { type: 'message', channel: 'CGU971U2F', ts: '1565583510.003900' },
//   reaction: 'issue',
//   item_user: 'UB9T3UXU0',
//   event_ts: '1565583513.004000'
// }

handler = new ReactionHandler({
  issueRepo: 'hello-ai/sandbox', // required
  reactionName: ['bug'], // default: ['issue', 'issue-assign_:assignee']
  slackToken: process.env.SLACK_TOKEN,
  slackUserToken: process.env.SLACK_USER_TOKEN,
  githubToken: process.env.GITHUB_TOKEN
})

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
