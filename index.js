var through = require('through2'),
gutil = require('gulp-util'),
formatter = require('./lib/html_formatter'),
path = require('path'),
fs = require('fs-extra'),
PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-protractor-cucumber-html-reporter';

function gulpProtractorCucumberHtmlReport(opts) {
  var currentDir = __dirname;

  opts = opts || {};

  opts.templates = {
    featureTemplate: path.join(currentDir, './templates/feature_template.html'),
    headerTemplate: path.join(currentDir, './templates/header_template.html'),
    reportTemplate: path.join(currentDir, './templates/report_template.html'),
    scenarioTemplate: path.join(currentDir, './templates/scenario_template.html'),
    stepTemplate: path.join(currentDir, './templates/step_template.html'),
    screenshotTemplate: path.join(currentDir, './templates/screenshot_template.html')
  };

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }
    
    var fileName;

    if (file.isBuffer()) {
      if (!opts.dest) {
        opts.dest = __dirname;
      }
      
      if (opts.filename) {
        fileName = opts.filename;
      }
      else {
        fileName = path.basename(gutil.replaceExtension(file.path, '.html'));
      }
      
      var testResults = JSON.parse(file.contents);

      var output = path.join(opts.dest, fileName);
      fs.open(output, 'w+', function (err, fd) {
        if (err) {
          fs.mkdirsSync(opts.dest);
          fd = fs.openSync(output, 'w+');
        }
        fs.writeSync(fd, formatter.generateReport(testResults, opts.templates));
        fs.copySync(path.join(__dirname, 'templates', 'assets'), path.join(opts.dest, 'assets'));

        gutil.log(PLUGIN_NAME + ':', 'HTML report has been created in', gutil.colors.cyan(output));

        cb(null, file);
      });
      
    } else {
      throw new PluginError(PLUGIN_NAME, '[Error] Currently only buffers are supported');
    }
  });
}

// Exporting the plugin main function
module.exports = gulpProtractorCucumberHtmlReport;
