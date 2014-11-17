/**
 * Created by varma on 11/15/14.
 */

var express = require('express'),
    http = require('http'),
    path = require('path'),
    amqp = require('amqp');
var bodyParser = require('body-parser')
var app = express();


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

var pub = __dirname + '/public';
app.use(express.static(pub));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

app.connectionStatus = 'No server connection';
app.exchangeStatus = 'No exchange established';
app.queueStatus = 'No queue established';

http.createServer(app).listen(7200, function()
{
   console.log("RabbitMQ + Node.js app running on AppFog");

});

app.get('/', function(req, res){
    res.render('index.jade',
        {
            title: 'Welcome to RabbitMQ and Node/Express as AppFog',
            connectionStatus: app.connectionStatus,
            exchangeStatus: app.exchangeStatus,
            queueStatus: app.queueStatus

        });

});

app.post('/start-server', function(req, res) {
    app.rabbitMqConnection = amqp.createConnection({host: 'localhost'});
    app.rabbitMqConnection.on('ready', function () {
        app.connectionStatus = 'Connected!';
        res.redirect('/');
    });
});

app.post('/new-exchange', function(req, res){
    app.e = app.rabbitMqConnection.exchange('test-exchange');
    app.exchangeStatus = 'The queue is ready to use!';
    res.redirect('/');
});

app.post('/new-queue', function(req, res){
    app.q = app.rabbitMqConnection.queue('test-queue');
    app.queueStatus = 'The queue is ready for use!';
    res.redirect('/');
});

app.get('/message-service', function(req, res){
    app.q.bind(app.e,'#');
    res.render('message-service.jade',
        {
            title: 'Welcome to the messaging service',
            sentMessage: ''
        });
});

app.post('/newMessage', function(req, res){
    var newMessage = req.body.newMessage;
    console.log('sending ' + newMessage);
    app.e.publish('routingKey', { message: newMessage });

    app.q.subscribe(function(msg){
        console.log('subscribed ' + msg.message);
        res.render('message-service.jade',
            {
                title: 'You\'ve got mail!',
                sentMessage: msg.message
            });
    });
});
