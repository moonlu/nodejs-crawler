var http = require('http');
var Crawler = require("crawler");
var jsdom = require('jsdom');
// var utils = require('./utils.js');
var request = require("request");
var fs = require('fs');
var mkdirp = require('mkdirp');
var URL = require('url');
var path = require("path");
http.createServer(function (req, response) {

  // 发送 HTTP 头部 
  // HTTP 状态值: 200 : OK
  // 内容类型: text/plain
  response.writeHead(200, {'Content-Type': 'text/plain'});
  var current_book = {};

  var url = req.url.match(/url=(.*)/i);

  if (Object.prototype.toString.call(url) != "[object Array]" || url.length < 2) {
    return;
  }
  var site_url = url[1];
  // var site_url = 'http://www.zxxk.com/gaokao/2016/showinfo.aspx?Page=1&InfoID=684568';
  // console.log(site_url);
  var timeStamp = new Date();
  var dir = path.dirname(__dirname + './images');
  var dirTag = false;
  var c = new Crawler({
      jQuery: jsdom,
      maxConnections : 100,
      forceUTF8:true,
      // incomingEncoding: 'gb2312',
      // This will be called for each crawled page
      callback : function (error, result, $) {
        // var urls = $('#list a');
        var urls = $($('.list-page')[0]).find('a');
        var title = $('title').text();
        current_book.title = title;
        // current_book.author = $('#info p').eq(0).text();
        // current_book.update_time = $('#info p').eq(2).text();
        // current_book.latest_chapter = $('#info p').eq(3).html();
        // current_book.intro = $('#intro').html();
        current_book.chapters = [];
        // console.log($(urls[0]).text());
        var count = 0;
        for(var i = 0; i< urls.length; i++){

          var url, _url;
          if (urls[i]) {
            // console.log(urls[i].innerText);
            if (isNaN(+$(urls[i]).text())) {
              count++;
              continue;
            }
          }
          // console.log(i);
          if (i > 0 && $(urls[i]).attr('href')) {
            url = urls[i];
            if (!url) {
              continue;
            }
            _url = 'http://www.zxxk.com' + $(url).attr('href') + "";
          }
          else {
            _url = site_url;
          }
          // var num = _url.replace('.html','');
          // var title = $(url).text();
          var num = _url.match(/-p(\d*)/i);
          if (!num) {
            _url = _url.replace('.html', '-p1.html');
            num = _url.match(/-p(\d*)/i);
          }
          var pageNum = '';
          if (num && num.length > 0) {
            pageNum = '第' + num[1] + '页';
            num = num[0];
          }
          if (!dirTag) {
            //本地存储目录
            dir = './images/'+$('title').text();
            console.log(dir);
            //创建目录
            mkdirp(dir, function(err) {
              if(err){
                console.log(err);
              }
            });
            dirTag = true;
          }
          // var obj = {};
          // obj.url = _url;
          // obj.title = title;
          // obj.num = num;
          // console.log(obj);
          current_book.chapters.push({
            num: num,
            title: pageNum,
            url: _url
          });
          // console.log(i-count);
          // console.log(current_book.chapters[i-count]);
          // 根据章节列表中的url获取每章正文
          getOneChapter(current_book.chapters[i-count]);
          if (i == urls.length - count - 1) {
            response.end(title);
          }
        }

        // 生成 book.json
        // utils.write_config(book_path, current_book);
      }
  });
  function getOneChapter(chapter){
    // 每章正文
    // console.log(site_url + chapter.num + '.html');
    // console.log(jsdom);
    var url = chapter.url;
    console.log(url);
    c.queue([{
      uri: url,
      jQuery: jsdom,
      forceUTF8:true,
      // The global callback won't be called
      callback: function (error, result, $) {
        // console.log(error);
        // console.log($('img'));
        $('.content img').each(function() {
          var src = $(this).attr('src');

          console.log(src);
          console.log('正在下载' + src);
          // console.log(chapter);
          download(src, dir, chapter.title + src.substr(-4,4));
          console.log('下载完成');
        });
        // var content = $('#content').html();
        // utils.write_chapter(book_path, chapter, content, timeStamp);
        
        //process.exit();
      }
    }]);
  }
  //下载方法
  var download = function(url, dir, filename){
    request.head(url, function(err, res, body){
      request(url).pipe(fs.createWriteStream(dir + "/" + filename));
    });
  };
  function start(){
    // 章节列表
    c.queue(site_url);
  }

  start();
}).listen(8888);

// 终端打印如下信息
console.log('Server running at http://127.0.0.1:8888/');
