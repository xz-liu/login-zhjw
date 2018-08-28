var request = require('request');
var fs = require('fs');
var iconv = require('iconv-lite');
var spawn = require('child_process').spawn;
var cheerio = require('cheerio');
var fiveScore = [];

fiveScore["&#x4F18;"] = 95;
fiveScore["&#x826F;"] = 85;
fiveScore["&#x4E2D;"] = 75;
fiveScore["&#x53CA;&#x683C;"] = 65;
fiveScore["&#x5408;&#x683C;"] = 80;

// fiveScore.push({
//     "优":95,
//     "良":85,
//     "中":75,
//     "及格":60,
//     "合格":80
// });
function parseScore(score) {
    if (!isNaN(score)) return parseInt(score);
    else if (fiveScore[score] != undefined) return fiveScore[score];
    else return 0;
}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text + '.jpg';
}
function indexes(string, searchFor) {
    count = 0, pos = string.indexOf(searchFor);

    while (pos > -1) {
        ++count;
        pos = string.indexOf(searchFor, ++pos);
    }
    return count;
}
var ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_1_4 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) CriOS/27.0.1453.10 Mobile/10B350 Safari/8536.25';
class AAOLogin {

    constructor(callback) {
        this.INFO_NONE = 0;
        this.INFO_BASIC = 1;
        this.INFO_PIC = 2;
        this.val = {};
        this.callback = callback;
    }

    async getBasicInfo(stuid) {
        //https://zhjw.neu.edu.cn/ACTIONFINDSTUDENTINFO.APPPROCESS?mode=1&showMsg=
        return new Promise((resolve, reject) => {
            request({
                method: 'post',
                url: 'https://zhjw.neu.edu.cn/ACTIONFINDSTUDENTINFO.APPPROCESS?mode=1&showMsg=',
                timeout: 1000000,
                jar: this.j,
                headers: {
                    'User-Agent': ua
                },
                json: true,
                encoding: null

            }, (async function (err, response, body) {
                if (err) reject();
                let html = iconv.decode(body, 'gb2312').toString('utf8');
                let schoolPos = html.search('<td width="15%" align="right" nowrap><span class="style3">院系</span></td>')
                    + '<td width="15%" align="right" nowrap><span class="style3">院系</span></td>              <td width="35%" align="left" nowrap>&nbsp;'.length;
                let school = html.substr(schoolPos, html.substring(schoolPos).search('</td>'));
                let ctId = html.substr(html.search(/<td width="35%" align="left">&nbsp;[0-9X]{18}/)
                    + '<td width="35%" align="left">&nbsp;'.length, 18);
                let classPos = html.search('<td width="15%" align="right" ><span class="style3">班级</span></td>')
                    + '<td width="15%" align="right" ><span class="style3">班级</span></td>            <td width="35%" align="left">&nbsp;&nbsp;'.length;
                let classNow = html.substr(classPos, html.substring(classPos).search('</td>'));
                if (!this.val) this.val = {};
                this.val.id = stuid.toString('utf8');
                this.val.curClass = classNow.toString('utf8');
                this.val.school = school.toString('utf8');
                this.val.citizenId = ctId.toString('utf8');
                console.log('setVal' + stuid + ',basic,' + classNow + ',' + school + ',' + ctId);
                console.log(JSON.stringify(this.val));
                resolve();
            }).bind(this));
        });
    }

    async getPhoto(stuid) {
        //https://zhjw.neu.edu.cn/ACTIONDSPUSERPHOTO.APPPROCESS
        return new Promise((resolve, reject) => {
            request({
                method: 'post',
                url: 'https://zhjw.neu.edu.cn/ACTIONDSPUSERPHOTO.APPPROCESS',
                timeout: 1000000,
                jar: this.j,
                headers: {
                    'User-Agent': ua
                },
                json: true,
                encoding: null
                // 学号:&nbsp;{id}&nbsp;&nbsp;&nbsp;&nbsp;姓名:&nbsp;
            }, (async function (err, response, body) {
                if (err) reject();
                // let photoFile = fs.createWriteStream('photo/' + stuid + '.jpg');
                // photoFile.write(body, 'binary');
                // photoFile.close();
                this.val = body;
                resolve();
            }).bind(this));
        });
    }

    async getTermScore(term) {
        return new Promise((resolve, reject) => {
            request({
                method: 'post',
                url: 'https://zhjw.neu.edu.cn/ACTIONQUERYSTUDENTSCORE.APPPROCESS?YearTermNO=' + term,
                timeout: 1000000,
                jar: this.j,
                headers: {
                    'User-Agent': ua
                },
                json: true,
                encoding: null
                // 学号:&nbsp;{id}&nbsp;&nbsp;&nbsp;&nbsp;姓名:&nbsp;
            }, (async function (err, response, body) {
                if (err) reject();
                let html = iconv.decode(body, 'gb2312').toString('utf8');
                let $ = cheerio.load(html);
                let allLines = [];
                $("tr.color-rowNext").each(function () {
                    let thisLine = [];
                    let hasInfo = false;
                    $(this).children('td').each(function () {
                        let now = $(this).html();
                        if (now && now != "&#xA0;") {
                            hasInfo = true;
                        }
                        thisLine.push(now);
                    });
                    if (hasInfo) {
                      //  console.log(thisLine[10]);
                      //  console.log("-------------" + parseScore(thisLine[10]));
                        thisLine.push(parseScore(thisLine[10]));
                        allLines.push(thisLine);
                    }
                });
                $("tr.color-row").each(function () {
                    let thisLine = [];
                    let hasInfo = false;
                    $(this).children('td').each(function () {
                        let now = $(this).html();
                        if (now && now != "&#xA0;") {
                            hasInfo = true;
                        }
                        thisLine.push(now);
                    });
                    if (hasInfo) {
                       // console.log("-------------" + parseScore(thisLine[10]));
                        thisLine.push(parseScore(thisLine[10]));
                        allLines.push(thisLine);
                    }
                });
                if(allLines.length!=0)this.val.course.push(allLines);
                resolve();
            }).bind(this));
        });
    }

    async getScore(stuid) {
        //  https://zhjw.neu.edu.cn/ACTIONQUERYSTUDENTSCORE.APPPROCESS
        return new Promise((resolve, reject) => {
            request({
                method: 'post',
                url: 'https://zhjw.neu.edu.cn/ACTIONQUERYSTUDENTSCORE.APPPROCESS',
                timeout: 1000000,
                jar: this.j,
                headers: {
                    'User-Agent': ua
                },
                json: true,
                encoding: null
                // 学号:&nbsp;{id}&nbsp;&nbsp;&nbsp;&nbsp;姓名:&nbsp;
            }, (async function (err, response, body) {
                if (err) reject();
                let html = iconv.decode(body, 'gb2312').toString('utf8');
                // console.log(basicInfo);
                // let gpaPos = html.search(/平均学分绩点：\d\.\d*/) + "平均学分绩点：".length;
                // let gpaEnd = gpaPos + 1;
                // while ('0123456789.'.includes(html[gpaEnd])) gpaEnd++;
                // let gpa = html.substring(gpaPos, gpaEnd);

                // console.log('--gpa: ' + gpa);
                let idPos = html.search(/学号:&nbsp;\d*/) + "学号:&nbsp;".length;
                idPos += '&nbsp;&nbsp;&nbsp;&nbsp;姓名:&nbsp;'.length;
                idPos += 8;
                let stuName = html.substr(idPos, html.substring(idPos).search('&nbsp;'));
                // console.log('--name: ' + stuName);
                // getEnd();
                if (!this.val) this.val = {};
                // this.val.gpa = gpa.toString('utf8');
                this.val.name = stuName.toString('utf8');
                let termTimes = indexes(html, "<option value");
                this.val.course = [];
                for (let i = 1; i <= termTimes; i++) {
                    await this.getTermScore(i);
                }
                // console.log('setVal' + stuid + ',score' + ',' + gpa + ',' + stuName);
                // console.log(JSON.stringify(this.val));
                resolve();
            }).bind(this));
        });
    }

    async submitLogin(id, pw, data, info) {
        let optionLogin = {
            method: 'post',
            url: 'https://zhjw.neu.edu.cn/ACTIONLOGON.APPPROCESS?mode=&WebUserNO=' + id + '&Password=' + pw + '&Agnomen=' + data + '&submit7=%B5%C7%C2%BC',
            timeout: 1000000,
            jar: this.j,
            headers: {
                'User-Agent': ua
            },
            json: true,
            encoding: null
        }
        await request(optionLogin
            , (async function (err, response, body) {
                if (err) console.log(err);
                else {
                    if (iconv.decode(body, 'gb2312').toString('utf8').search('网络综合平台') >= 0) {
                        if (info === this.INFO_BASIC) {
                            await this.getBasicInfo(id);
                            await this.getScore(id);
                            this.callback(this.val);
                        } else if (info === this.INFO_PIC) {
                            await this.getPhoto(id);
                            this.callback(this.val);
                        } else {
                            this.callback(true);
                        }
                    } else {
                        this.callback(false);
                    }
                    // console.log();
                    // out.write(iconv.decode(body,'gb2312'),'UTF8');
                }
            }).bind(this));
    }
    async loginAs(id, pw, info) {
        this.j = request.jar();
        let succ = false;
        let optionGetCode = {
            method: 'post',
            url: 'https://zhjw.neu.edu.cn/',
            timeout: 1000000,
            jar: this.j,
            headers: {
                'User-Agent': ua
            },
            json: true,
            encoding: null
        };
        request(optionGetCode, (async function (err, response, body) {
            if (err) console.log(err);
            else {
                let codeId = response.body.toString().match(/id=\d*\.\d*/)[0].replace("id=", '');
                let optionCodePic = {
                    method: 'get',
                    url: 'https://zhjw.neu.edu.cn/ACTIONVALIDATERANDOMPICTURE.APPPROCESS?id=' + codeId,
                    timeout: 1000000,
                    jar: this.j,
                    headers: {
                        'User-Agent': ua
                    },
                    json: true,
                    encoding: null
                };
                request(optionCodePic, (err, responst, body) => {
                    if (err) return;
                    let name = makeid();
                    let file = fs.createWriteStream(name);
                    file.write(body);
                    file.close();
                    var getAns = spawn('python', ["readimg.py", name]);
                    getAns.stdout.on('data', (async function (data) {
                        // console.log('ondata');
                        data = data.toString().replace('\r', '').replace('\n', '');
                        // console.log('[' + data + ']');
                        this.submitLogin(id, pw, data, info);

                    }).bind(this));
                });
            }

        }).bind(this));
    }
}

module.exports = {
    loginOnly: async function (id, pw, callback) {
        // let succ = true;
        let aao = new AAOLogin(callback);
        await aao.loginAs(id, pw, aao.INFO_NONE);
        // return succ;
    },
    basicInfo: async function (id, pw, callback) {
        let aao = new AAOLogin(callback);
        await aao.loginAs(id, pw, aao.INFO_BASIC);
    }, getPic: async function (id, pw, callback) {
        let aao = new AAOLogin(callback);
        await aao.loginAs(id, pw, aao.INFO_PIC);
    }
}