const cheerio = require('cheerio');
const fs = require('fs');

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
    return msgData;
}

function loadDataIntoFile(data) {
    fs.writeFile("messages.txt", JSON.stringify(data), function(err) {
        if (!err) {
            console.log("Messages stored");
        } else {
            console.log(err);
        }
    });
}

function readFileData() {
    fs.readFile('messages.htm', 'utf-8', function(err, data) {
        if (!err) {
            loadDataIntoFile(processFileData(data));
        } else {
            console.log(err);
        }
    });
}
readFileData();
