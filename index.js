const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const cheerio = require('cheerio');
const app = express();
var messages = [];

function getRandomMessage() {
    const randInd = Math.floor(Math.random() * (messages.length + 1));
    const msg = messages[randInd];
    return msg.text + " — " + msg.author + ", " + msg.date.toLocaleDateString();
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

function processFileData(data) {
    const $ = cheerio.load(data);
    console.log("Messages parsed");
    const messageList = $(".webMessengerMessageGroup");
    var msgData = [];
    messageList.each(function(i, m) {
        var message = {};
        const node = $($($(m).children()[0]).children()[1]);
        const body = $(node.children()[1]);

        message.date = new Date($(node.children()[0]).text());
        message.author = $(body.children()[0]).text();
        message.text = $(body.children()[1]).text();
        msgData.push(message);
    });
    messages = msgData;
}

readFileData();

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function(req, res) {
    res.send('This is the server for Assume Zero Bot Power');
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
            sendMessage(event.sender.id, {
                text: getRandomMessage()
            });
        }
        res.sendStatus(200);
    }
});
