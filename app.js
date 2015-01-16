'use strict';

var handlebars = require('handlebars');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var version = 2.0;

// Handlebars Helper
handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
  switch (operator) {
    case '==':
      return (v1 == v2) ? options.fn(this) : options.inverse(this);
      break;
    case '===':
      return (v1 === v2) ? options.fn(this) : options.inverse(this);
      break;
    case '<':
      return (v1 < v2) ? options.fn(this) : options.inverse(this);
      break;
    case '<=':
      return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      break;
    case '>':
      return (v1 > v2) ? options.fn(this) : options.inverse(this);
      break;
    case '>=':
      return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      break;
    default:
      return options.inverse(this);
      break;
  }
  return options.inverse(this);
});

var config = {
  path: {
    css: './src/css',
    js: './src/js'
  },
  dist: {
    sublime: '/dist/sublime',
    webstorm: '/dist/webstorm'
  }
};
var prefixName = 'am-';
var fsOptions = {encoding: 'utf8'};

var data = (function readData() {
  var cssFiles = fs.readdirSync(config.path.css);
  var jsFiles = fs.readdirSync(config.path.js);
  var cssTpl = [];
  var cssConfig = [];
  var jsTpl = [];
  var jsConfig = [];

  _.each(cssFiles, function(data) {
    cssTpl.push(fs.readFileSync(path.join(config.path.css, data, 'tpl.hbs'), fsOptions));
    cssConfig.push(require('./' + path.join(config.path.css, data, 'config.js')));
  });

  _.each(jsFiles, function(data) {
    jsTpl.push(fs.readFileSync(path.join(config.path.js, data, 'tpl.hbs'), fsOptions));
    jsConfig.push(require('./' + path.join(config.path.js, data, 'config.js')));
  });

  return {
    cssTpl: cssTpl,
    cssConfig: cssConfig,
    jsTpl: jsTpl,
    jsConfig: jsConfig
  }
})();

var cssData = compileHBS(data.cssTpl, data.cssConfig);
var jsData = compileHBS(data.jsTpl, data.jsConfig);

// write sublime snippets
compileSublime(cssData);
compileSublime(jsData);

// write webstorm Live Templates

compileWebstorm();

function compileWebstorm() {
  var tpl = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<templateSet group="AmazeUI' + version + '">',
    '</templateSet>'
  ];
  _.each(cssData, function(value) {
    var triggerName = value.triggerName;
    var regLt = /</mg;
    var regGt = />/mg;
    var regQuo = /\"/mg;
    var data = value.data.replace(regLt, '&lt;');
    data = data.replace(regGt, '&gt;');
    data = data.replace(regQuo, '&quot;');
    console.log(data);
    /*var liveTpl = [
      '<template name="'+ triggerName +'" value="'+  +'" toReformat="true" toShortenFQNames="true">',
      '<variable name="classname" expression="" defaultValue="" alwaysStopAt="true" />',
      '<context>',
      '<option name="HTML_TEXT" value="true" />',
      '<option name="HTML" value="true" />',
      '</context>',
      '</template>;'
    ]*/
  });
}

/** *
 * @param data
 */
function compileSublime(data) {
  _.each(data, function(value) {
    var dirPath = __dirname + config.dist.sublime;
    var dirName = dirPath + '/' + value.name;
    var fireName = dirName + '/' + prefixName + value.name;
    if (value.fileName) {
      fireName += '-' + value.fileName + '.sublime-snippet';
    } else {
      fireName += '.sublime-snippet';
    }

    var result = [
      '<snippet>',
      '<content><![CDATA[',
      value.data,
      ']]></content>',
          '<tabTrigger>'+ value.triggerName +'</tabTrigger>',
      '</snippet>'
    ].join('');

    mkdirsSync(dirName);

    fs.writeFile(fireName, result, function(err) {
      if (err) throw err;
    });
  });
}

/**
 * @param dirname
 * @param mode
 * @returns {boolean}
 */
function mkdirsSync(dirname, mode){
  if(fs.existsSync(dirname)){
    return true;
  }else{
    if(mkdirsSync(path.dirname(dirname), mode)){
      fs.mkdirSync(dirname, mode);
      return true;
    }
  }
}

/**
 * 编译 handlebars
 * @param tpl
 * @param config
 */

function compileHBS(tpl, config) {
  var result = [];
  _.each(config, function(value, index) {
    var template = handlebars.compile(tpl[index]);

    _.each(value, function(data, key, list) {
      var triggerName;

      if (_.isArray(data)) {

        _.each(data, function(v) {
          triggerName = prefixName + list.name + ':' + v;
          result.push(
              {
                name: list.name,
                fileName: v,
                triggerName: triggerName,
                data: template({className: v})
              }
          )
        })

      } else {

        triggerName = prefixName + list.name;
        result.push(
            {
              name: list.name,
              fileName: '',
              triggerName: triggerName,
              data: template({})
            }
        )

      }
    });

  });

  return result;
}