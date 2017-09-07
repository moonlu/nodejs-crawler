//依赖模块
var fs = require('fs');
var http = require('http');
var request = require("request");
var cheerio = require("cheerio");
var mkdirp = require('mkdirp');
http.createServer(function (req, response) {
  //目标网址
  var url = req.url.match(/url=([^&]*)/i);
  var dir_name = req.url.match(/name=([^&]*)/i);
  if (Object.prototype.toString.call(url) != "[object Array]" || url.length < 2 || Object.prototype.toString.call(dir_name) != "[object Array]" || dir_name.length < 2) {
    return;
  }
  url = decodeURIComponent(url[1]);
  dir_name = decodeURIComponent(dir_name[1]);
  //本地存储目录
  var dir = './images/' + dir_name;
  console.log(dir_name);
  console.log(url);
  //创建目录
  mkdirp(dir, function(err) {
    if(err){
      console.log(err);
    }
  });

  //发送请求
  request(url, function(error, response, body) {
    if(!error && response.statusCode == 200) {
      var $ = cheerio.load(body);
      $('.air_con img').each(function(index) {
        var src = $(this).attr('src');
        if (!src) return;
        // var src = 'http://cp01-cp01-apptest.epc.baidu.com:8119/wkna/' + $(this).attr('src');
        console.log('正在下载' + src);
        download(src, dir, (index + 1) + src.substr(-4,4));
        // download(src, dir, src.substr(src.lastIndexOf('/')+1));
        console.log('下载完成');
      });
    }
  });
   
  //下载方法
  var download = function(url, dir, filename){
    request.head(url, function(err, res, body){
      request(url).pipe(fs.createWriteStream(dir + "/" + filename));
    });
  };
}).listen(8899);
// 终端打印如下信息
console.log('Server running at http://127.0.0.1:8899/');