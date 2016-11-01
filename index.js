const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const cheerio = require('cheerio');
const app = express();
var messages = [];

function getRandomMessage(optName) {
    var msg = getRandMessObj();
    if (!optName) { // No name specified
        while (!validMessage(msg.text)) { // 320 char limit
            msg = getRandMessObj();
        }
    } else {
        while (!(validMessage(msg.text) && isAuthor(msg.author, optName))) {
            msg = getRandMessObj();
        }
    }
    return msg.text + " — " + msg.author + ", " + msg.date.toLocaleDateString();
}

function getRandMessObj() {
    return messages[Math.floor(Math.random() * (messages.length + 1))];
}

function validMessage(text) {
  return (text.length <= 320 && text.length > 0);
}

function isAuthor(chatAuthor, matchedAuthor) {
    chat = chatAuthor.toLowerCase().split(" ")[0];
    match = matchedAuthor.toLowerCase();
    if (chat == "yiyi") {
        return (match == "yiyi" || match == "zhiyi" || match == "jason" || match == "justin");
    } else if (chat == "cameron") {
        return (match == "cam" || match == "cameron");
    } else if (match == "marin" || match == "colin") {
        return true; // For now, Marin/Colin are not supported
    } else {
        return chat == match;
    }
}

function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: recipientId
            },
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

function readFileData() {
    fs.readFile('messages.htm', 'utf-8', function(err, data) {
        if (!err) {
            processFileData(data);
        }
    });
}
readFileData();

function processFileData(data) {
    const $ = cheerio.load(data);
    console.log("Messages loaded");
    const messageList = $(".webMessengerMessageGroup");
    var msgData = [];
    messageList.each(function(i, m) {
        var message = {};
        const node = $($($(m).children()[0]).children()[1]);
        const body = $(node.children()[1]);

        message.date = new Date($(node.children()[0]).text());
        message.author = $(body.children()[0]).text();

        const msgBody = $($($(body.children()[1])).children()[0]);
        var msgStr = "";
        if (msgBody.children().length > 1) {
            msgBody.children().each(function(i, m) {
                msgStr += $(m).text();
                if (i != msgBody.children().length - 1) {
                    msgStr += "\n"
                }
            });
        } else {
            msgStr = msgBody.text()
        }
        message.text = msgStr;
        msgData.push(message);
    });
    messages = msgData;
    console.log("Messages stored");
}

function handleMessage(message) {
    // Thanks Yiyi
    const comMatches = message.text.match(/Yo (jonah|larry|cam(?:eron)?|(?:zh|y)iyi|j(?:ason|ustin)|colin|marin)/i);
    var txt = "";
    if (comMatches && comMatches[1]) {
        // This isn't necessary to check (could just pass the undefined match object), but this makes the function's behavior
        // more obvious in case I ever have to fix/modify it
        txt = getRandomMessage(comMatches[1]);
    } else {
        txt = getRandomMessage();
    }
    return txt;
}

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function(req, res) {
    res.send('This is the server for Assume Zero Bot Power.');
});

// Facebook Webhook
app.get('/webhook', function(req, res) {
    if (req.query['hub.verify_token'] === 'assume_zero_verification') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

app.post('/webhook', function(req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text && messages.length > 0) {
            const msgText = handleMessage(event.message);
            sendMessage(event.sender.id, {
                text: msgText
            });
        }
        res.sendStatus(200);
    }
});
