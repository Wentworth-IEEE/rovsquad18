Here's Bobby's <s>mildly vague</s> fun little guide to adding new commands to our fun little command protocol. Yay!

# 1. What do you even need
What does this command even do? Figure out what the surnface station actually needs to send to the robot for this command to not be a waste of network traffic.

# 2. Make a token (`botProtocol`)
Let's make what we're sending official. Make a new class that `extends token` in `botProtocol` and add a new `tokenType` for it. Make sure the important information that we're sending gets set in the token's `body` (it's the second agument for the `super` constructor). Don't forget to add the token to `module.exports` 

# 3. Put it on the bot (`botServer`)
Remember when we asked what this command even does? Let's make _that_ official.

Write out what you need the command to actually do in `botServer`. Don't forget to attach a handler to `emitter` that listens for your `tokenType`.


# 4. Put it on the surface (`botSocket`)
Make a function that sends your token to the robot and takes the appropriate action when it gets a response.

# 5. TEST TEST TEST
Test your shiny new command to make sure it works. One you know it does, automate your test and put it in `test` so you don't have to keep doing it by hand.