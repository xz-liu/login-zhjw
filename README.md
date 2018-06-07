# login-zhjw
log in zhjw and get some basic informations!

## configs
    yum install nodejs
    yum install python3
    yum install opencv
    pip install numpy
    pip install opencv-python
### in project folder
    npm install request
    npm install iconv-lite

## use

```javascript
var aaoLogin = require('./aao-login'); 

//log in, check if password is correct 
aaoLogin.loginOnly('your id', 'your password', (v) => {
    //v is a bool
});
//get some basic informations
aaoLogin.basicInfo('your id', 'your password', (v) => {
    //v is a bool
});
//get your photo
aaoLogin.getPic('your id', 'your password', (v) => {
    //show image (v)
});
```
