# Assume Zero Bot Power (AØBøt)

This is a Facebook Messenger bot written in [Node.js](http://nodejs.org). It allows users to access past messages from a large group chat with a variety of commands.

Passing a date will attempt to locate a message written at that date. If two dates are provided, it will search for a message in that range of dates. To find a message from a specific person, use `Yo [name]`. To generate a message from a person's chat history using Markov chains, use `Yo [name]bot`. A message that doesn't trigger any commands will simply return a random message from the history of the chat.
