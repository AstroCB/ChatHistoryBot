const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const app = express();
var messages = [];

function getRandomMessage(optName, optDate) {
    var msg = getRandMessObj();
    if (!(optName || optDate)) { // No name/date specified
        while (!validMessage(msg.text)) { // 320 char limit
            msg = getRandMessObj();
        }
    } else { // At least one option was passed (can modularize later if I add a lot of opts)
        const authData = optName ? {
            current: msg.author,
            matched: optName[1],
            name: "auth"
        } : null;
        const dateData = optDate ? {
            current: new Date(msg.date),
            matched: optDate,
            name: "date"
        } : null;

        while (!(validMessage(msg.text) && validWithOpts([authData, dateData]))) {
            msg = getRandMessObj();
            if (authData) {
                authData.current = msg.author;
            }
            if (dateData) {
                dateData.current = new Date(msg.date);
            }
        }
    }
    return msg.text + " — " + msg.author + ", " + new Date(msg.date).toLocaleDateString();
}

function getRandMessObj() {
    return messages[Math.floor(Math.random() * messages.length)];
}

function validMessage(text) {
    return (text.length <= 320 && text.length > 0);
}

function validWithOpts(opts) {
    var results = [];
    for (var i = 0; i < opts.length; i++) {
        if (opts[i]) {
            results.push(check(opts[i]));
        }
    }
    return (results.indexOf(false) < 0);
}

function check(opt) {
    switch (opt.name) {
        case 'auth':
            return checkAuth(opt);
            break;
        case 'date':
            return checkDate(opt);
            break;
        default:
            console.log("Test not found: " + opt.name);
            return false;
            break;
    }
}

function checkAuth(data) {
    chat = data.current.toLowerCase().split(" ")[0]; // First name from author field
    match = data.matched.toLowerCase();
    if (chat == "yiyi") {
        return (match == "yiyi" || match == "zhiyi" || match == "jason" || match == "justin");
    } else if (chat == "cameron") {
        return (match == "cam" || match == "cameron");
    } else if (match == "marin" || match == "colin") {
        return true; // For now, Marin/Colin are not supported
    } else {
        // Jonah/Larry
        return chat == match;
    }
}

Date.prototype.addDay = function() {
    this.setDate(this.getDate() + 1);
}

function checkDate(data) {
    current = data.current;
    matchedDates = data.matched;
    if (matchedDates.length > 1) { // Range
        const firstMatch = new Date(matchedDates[0]);
        const secondMatch = new Date(matchedDates[1]);
        secondMatch.addDay();
        if (firstMatch.toDateString() == secondMatch.toDateString()) {
            // Same date: return within day
            return verifyOneDate(current, firstMatch);
        }
        if (firstMatch < secondMatch && dateValid(firstMatch) && dateValid(secondMatch)) {
            // Return whether current date is in passed range
            return (current >= firstMatch && current <= secondMatch);
        } else {
            return true; // Terminate: passed invalid date range
        }
    } else { // Only 1
        return verifyOneDate(current, new Date(matchedDates[0]));
    }
}

function verifyOneDate(current, match) {
    // Only need to check if they're the same day
    if (dateValid(match)) {
        return (match.toDateString() == current.toDateString());
    } else {
        return true; // Terminate: invalid date
    }
}

function dateValid(date) {
    // Thank you sorted arrays
    const firstDate = new Date(messages[0].date);
    const lastDate = new Date(messages[messages.length - 1].date);
    // Match occurs after first message and before last
    return (date >= firstDate && date <= lastDate);
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

function loadMessageData() {
    console.log("Loading messages");
    fs.readFile("messages.txt", {
        encoding: "utf-8"
    }, function(err, data) {
        if (!err) {
            messages = JSON.parse(data);
            console.log("Messages retrieved");
        } else {
            console.log(err);
        }
    });
}
loadMessageData();

function getRandLine(file) {
    const fileData = fs.readFileSync("markov_sentences/" + file, {
        encoding: "utf-8"
    });
    var fileArr = fileData.split("\n");
    fileArr = removeNewlines(fileArr);
    return fileArr[Math.floor(Math.random() * (fileArr.length - 1))];
}

function removeNewlines(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == "\n") {
            arr.splice(i, 1);
        }
    }
    return arr;
}

function getMarkovs(matches) {
    const a = matches[1] ? matches[1].toLowerCase() : null;
    if (a) { // Name param passed
        if (a == "cam" || a == "cameron") {
            return getRandLine("cam.txt") + " ~ Cameron Bernhardt";
        } else if (a == "yiyi" || a == "zhiyi" || a == "jason" || a == "justin") {
            return getRandLine("yiyi.txt") + " ~ Yiyi Kuang";
        } else if (a == "larry") {
            return getRandLine("larry.txt") + " ~ Larry Steele";
        }
    } else {
        const authors = [{
            name: "cam.txt",
            author: "Cameron Bernhardt"
        }, {
            name: "yiyi.txt",
            author: "Yiyi Kuang"
        }, {
            name: "larry.txt",
            author: "Larry Steele"
        }];
        const chosen = authors[Math.floor(Math.random() * authors.length)];
        return getRandLine(chosen.name) + " ~ " + chosen.author;
    }
}

function handleMessage(message) {
    const markMatches = message.text.match(/Yo ((?:zh|y)iyi|j(?:ason|ustin)|larry|cam(?:eron)?)?bot/i);
    if (markMatches) {
        return getMarkovs(markMatches);
    } else {
        // Thanks Yiyi
        const nameMatches = message.text.match(/Yo (jonah|larry|cam(?:eron)?|(?:zh|y)iyi|j(?:ason|ustin)|colin|marin)/i);
        const hasNameMatch = !!(nameMatches && nameMatches[1]); // Double negate to ensure it's a boolean
        const dateMatches = message.text.match(/(\d(?:\d)?\/\d(?:\d)?\/\d\d(?:\d\d)?)/g);
        const hasDateMatch = !!(dateMatches && dateMatches[0]);
        return getRandomMessage(hasNameMatch ? nameMatches : null, hasDateMatch ? dateMatches : null);
    }
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
