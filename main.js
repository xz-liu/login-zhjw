var aaoLogin = require('./aao-login');
var http = require('http');
var url = require('url');
var fs = require('fs');
http.createServer(function (req, res) {
    var parts = url.parse(req.url, true);
    var query = parts.query;
    if (query['id'] && query['pw'] && query['t']) {
        switch (query['t']) {
            case 'login':
                aaoLogin.loginOnly(query['id'], query['pw'], (v) => {
                    res.writeHead(200, { "Content-Type": "text/plain;charset=utf-8" });
                    res.end(JSON.stringify(v));
                });
                break;
            case 'info':
                aaoLogin.basicInfo(query['id'], query['pw'], (v) => {
                    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
                    res.end(JSON.stringify(v));
                });
                break;
            case 'pic':
                aaoLogin.getPic(query['id'], query['pw'], (v) => {
                    res.writeHead(200, { "Content-Type": "image/jpeg" });
                    res.end(v);
                });
                break;
            default:
                res.writeHead(200);
                res.end();
                break;
        }
    } else {
        //console.log('no param');
        res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        var text = fs.readFileSync('index.html', 'utf8');
        res.end(text);

    }
}).listen(3002);