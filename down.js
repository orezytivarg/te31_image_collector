var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var _ = require('lodash');

var latestArticleNumber = 0;

var download = function(uri, fileName, callback) {
  console.log(uri);
  request(uri).on('response', function (res) {
    var fileExt = '.' + res.headers['content-type'].split('/')[1];
    var filePath = './images/' + fileName + fileExt;
    if (!fs.existsSync(filePath)) {
      res.pipe(fs.createWriteStream(filePath)).on('close', callback.bind(null, filePath));
    }
  })
};

var getImages = function(link) {
  request('http://te31.com/rgr/' + link, function(err, res, body) {
    if (err) {
      return;
    }

    var $ = cheerio.load(body);

    var images = _.map($('.blocked_image, .imgur'), function (img) {
      var uri = $(img.parent).attr('href');
      if (uri.indexOf('=') !== -1) {
        uri = uri.split('=')[1];
      }
      var id = /[^/]*$/.exec(uri)[0];
      return {
        uri: uri,
        id: id,
      };
    });

    _.each(images, function (image) {
       download(image.uri, image.id, function(filePath) { console.log(filePath) });
    });
  });
}

var main = function() {
  request('http://te31.com/rgr/zboard.php?id=rgrong', function(err, res, body) {
    if (err) {
      return;
    }

    var $ = cheerio.load(body);

    var articles = $('.title a');
    var articlesWithImage = _.filter(articles, function(a) {
      if (!a.next) {
        return false;
      }

      if (!a.next.next) {
        return false;
      }

      if (a.next.next.name === 'img') {
        return true;
      }

      return false;
    });

    var links = _.map(articlesWithImage, function(a) { return $(a).attr('href') });
    var newers = _.filter(links, function(l) {
      var num = l.match(/\d+$/)[0];
      if (num > latestArticleNumber) {
        latestArticleNumber = num;
        return true;
      } else {
        if (latestArticleNumber - num > 10000) {
          latestArticleNumber = num;
          return true;
        }
        return false;
      }
    })
    _.each(newers, getImages);
  });
}

main();
setInterval(main, 60000);
