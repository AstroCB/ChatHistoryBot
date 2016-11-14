# Assume Zero Bot Power (AØBøt)

This is a Facebook Messenger bot written using [Node.js](http://nodejs.org). It allows users to access past messages from a large group chat with a variety of commands. In addition, it can generate new messages using [Markov chains](https://en.wikipedia.org/wiki/Markov_chain) and the past chat history of a given user.

Passing a date will prompt the bot to locate a message written at that date. If two dates are provided, it will search for a message in that range of dates. To find a message from a specific person, use `Yo [name]`. These two command types can be combined to find messages from a specific person on a given date or within a range of dates.

To generate a fictional message from a person's chat history using Markov chains, use `Yo [name]bot`. A message that doesn't trigger any commands will simply return a random message from the entire history of the chat.
