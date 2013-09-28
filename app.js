'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    routes = require('./frontend/routes'),
    http = require('http'),
    path = require('path'),
    config = require('./config/config.json'),
    collectData = require('./lib/utils/collectData'),
    server,
    io,
    adapters = [];

config.miners.forEach(function (minerConfig) {
    var Adapter = require('./lib/adapters/' + minerConfig.adapter),
        adapter = new Adapter(minerConfig);

    minerConfig.middlewares.forEach(function (mw) {
        adapter.use(require('./lib/' + mw)(minerConfig));
    });

    adapters.push(adapter);
});

// TODO: Logging

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/frontend/views');
    app.engine('hbs', exphbs({
        layoutsDir: '/frontend/views/layouts/',
        partialsDir: '/frontend/views/partials/',
        defaultLayout: 'main',
        extname: '.hbs'
    }));
    app.set('view engine', 'hbs');
    app.set('adapters', adapters);
    app.set('config', config);
    app.use(express.favicon('frontend/public/images/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(require('stylus').middleware(__dirname + '/public'));
    app.use(express.static(path.join(__dirname, '/frontend/public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

routes(app);

server = http.createServer(app).listen(app.get('port'), function(){
    io = require('socket.io').listen(server, { log: false });
    adapters.forEach(function (adapter) {
        adapter.on('statusUpdate', function () {
            io.sockets.emit('statusUpdate', collectData(app));
        });
    });
    console.log('Express and Websocket server listening on port ' + app.get('port'));
});
