// # SimpleServer
// A simple chat bot server
var logger = require('morgan');
var http = require('http');
var bodyParser = require('body-parser');
var express = require('express');
var router = express();

var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
var server = http.createServer(app);
var request = require("request");
var firebase = require('firebase');
var myApp = firebase.initializeApp({
  serviceAccount: 'facebook-chat-bot-af57037b6ad9.json',
  databaseURL: "https://facebook-chat-bot-57099.firebaseio.com/"
});
var database = myApp.database();

app.get('/', (req, res) => {
  res.send("Home page. Server running okay.");
});

// Đây là đoạn code để tạo Webhook
app.get('/webhook', function(req, res) {
  if (req.query['hub.verify_token'] === 's7oCJFGjqY4fqr') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});
// Xử lý khi có người nhắn tin cho bot
app.post('/webhook', function(req, res) {
  var entries = req.body.entry;
  for (var entry of entries) {
    var messaging = entry.messaging;
    for (var message of messaging) {
      var senderId = message.sender.id;
      if (message.message) {
        // If user send text
        if (message.message.text) {
          var text = message.message.text;
          try {
            database.ref(text.toLowerCase()).once('value').then(function(snapshot) {
              console.log(snapshot.val());
              if (snapshot.val() !== null) {
                sendMessage(senderId, snapshot.val());
              } else {
                sendMessage(senderId, 'I don\'t know :(');
              }
            });
          } catch(err) {
            sendMessage(senderId, 'I don\'t know :(');
          }
        }
      }
    }
  }

  res.status(200).send("OK");
});


// Gửi thông tin tới REST API để trả lời
function sendMessage(senderId, message) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: "EAAF5DvcXjBcBAKJiZBNVWDqeQTuKYEyyeDPU38XM9L58bA3caC8o0cdk3LBTgao7dnmg6Aow5m7x0RbpGZC7j4bJQShlFvCHrWEumtwxaSpZBvc8G9EK5P9IIQzaMmD5JVdZAcB6ZB4dOMgGu8ZADow0Fp0AtUvfQTWmvQztKl0gZDZD",
    },
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      message: {
        text: message
      },
    }
  });
}

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1");

server.listen(app.get('port'), app.get('ip'), function() {
  console.log("Chat bot server listening at %s:%d ", app.get('ip'), app.get('port'));
});