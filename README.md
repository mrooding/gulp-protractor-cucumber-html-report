# gulp-protractor-cucumber-html-report

> Generate html report from JSON file returned by CucumberJS json formatter

This is a stand-alone fork of [grunt-protractor-cucumber-html-report](https://github.com/robhil/grunt-protractor-cucumber-html-report)

## Getting Started
This plugin requires Gulp `~3.9.0`

If you haven't used [Gulp](http://gulpjs.com/) before, be sure to check out the [Getting Started](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) guide, as it explains how to create a Gulpfile as well as install and use Gulp plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install gulp-protractor-cucumber-html-report --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gulpfile with this line of JavaScript:

```js
var reporter = require('gulp-protractor-cucumber-html-report');
```

## The "protractor-cucumber-html-report" task

### Options

#### options.dest
Type: `String`
Default value: `'.'`

The output directory for the HTML report relative from the Gulpfile

#### options.filename
Type: `String`
Default value: `'report.html'`

The filename for the HTML report

### Usage Examples

#### Overview
In your project's Gulpfile, you can use the reporter in your pipeline as follows:

```js
gulp.src('./cucumber-test-results.json')
    .pipe(protractorReport({
        dest: 'reports/'
    }));
```

#### Saving CucumberJS json to disk when using Protractor
If you're using Protractor in combination with CucumberJS there currently is [no way](https://github.com/cucumber/cucumber-js/issues/90) to save the CucumberJS JSON output to a file. 
 
It is however possible to add a listener to the CucumberJS JSON formatter and save it to a file manually. The following hook can be added to your project and included to your Protractor configuration.

```js
var Cucumber = require('cucumber'),
  fs = require('fs'),
  path = require('path');
var JsonFormatter = Cucumber.Listener.JsonFormatter();
var reportDirectory = 'reports/one/two/';
var reportFileName = 'cucumber-test-results.json';
var reportDirectoryPath = path.join(__dirname, '../../' + reportDirectory);
var reportFilePath = path.join(reportDirectoryPath + reportFileName);
function mkdirp(path, root) {
  var dirs, dir;
  dirs = path.split('/');
  dir = dirs.shift();
  root = (root || '') + dir + '/';
  try {
    fs.mkdirSync(root);
  } catch (e) {
    if (!fs.statSync(root).isDirectory()) { throw new Error(e); }
  }
  return !dirs.length || mkdirp(dirs.join('/'), root);
}
module.exports = function JsonOutputHook() {
  JsonFormatter.log = function (json) {
    fs.open(reportFilePath, 'w+', function (err, fd) {
      if (err) {
        mkdirp(reportDirectoryPath);
        fd = fs.openSync(reportFilePath, 'w+');
      }
      fs.writeSync(fd, json);
      console.log('json file location: ' + reportFilePath);
    });
  };
  this.registerListener(JsonFormatter);
};
```

Above snippet will hook into the CucumberJS JSON formatter and save the JSON to a file called 'cucumber-test-results.json' in the './reports' folder (relative from this file's location)

#### Setting up Protractor, CucumberJS and the JSON listener

In your protractor.conf.js add a reference to the hook listener (as shown above). In this example the file is found in './support'. Also make sure to set the output format to 'json'.

```js
cucumberOpts: {
  require: ['steps/*.js', 'support/*.js'],
  format: 'json'
},
```

#### Screenshot support for failing scenarios

Adding screenshots of failing scenarios to the HTML report requires you to add an After hook. This can be easily achieved by creating a Javascript file with the following content:

```js
module.exports = function TakeScreenshot() {
    this.After(function (scenario, callback) {
        if (scenario.isFailed()) {
            browser.takeScreenshot().then(function (png) {
                var decodedImage = new Buffer(png, 'base64').toString('binary');
                scenario.attach(decodedImage, 'image/png');

                callback();
            });
        } else {
            callback();
        }
    });
};
```

If you're using the cucumberOpts as shown in *Setting up Protractor, CucumberJS and the JSON listener* then all you need to do is save this to a Javascript file in the 'support/' folder. Otherwise you have to change the cucumberOpts require property to load your hook.

This is all that's required to add the saved screenshots to the HTML report.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality.

## Copyright
 
Copyright for portions of project [gulp-protractor-cucumber-html-report](https://github.com/mrooding/gulp-protractor-cucumber-html-report) are held by Robert Hilscher, 2015 as part of project [grunt-protractor-cucumber-html-report](https://github.com/robhil/grunt-protractor-cucumber-html-report). All other copyright for project [gulp-protractor-cucumber-html-report](https://github.com/mrooding/gulp-protractor-cucumber-html-report) are held by Marc Rooding, 2015.

## Release History
0.0.8:
  - Fix for not ignoring the After screenshot step
  
0.0.7:
  - Empty After steps as a result of the screenshot hook will not be added to the HTML report anymore
  
0.0.6:
  - Support for saving screenshots of failed scenarios
  
0.0.5:
  - More robust creation of the output directory [thanks smuldr!](https://github.com/smuldr)
  - Fixed the HTML reporter when using multiple feature files
