var assert = require('assert');
var fs = require('fs-extra');
var path = require('path');
var File = require('vinyl');
var reporter = require('../index');
var path = require('path');

var outputFolder = path.join(__dirname, '../output');

describe('gulp-protractor-cucumber-html-report', function() {
  describe('in buffer mode', function() {
    before(function () {
      fs.emptyDirSync(outputFolder);
    });
    
    function createFile(jsonPath) {
      var jsonFileBuffer = fs.readFileSync(path.join(__dirname, jsonPath));
      var jsonFile = new File({
        contents: jsonFileBuffer,
        path: path.join(__dirname, jsonPath)
      });
      
      return jsonFile;  
    }    

    it('should create a report', function(done) {
      var stream = reporter({
        dest: 'output'
      });

      var jsonFile = createFile('./data/cucumber_report.json');

      var expectedReportBuffer = fs.readFileSync(path.join(__dirname, './data/expected_report.html'));
          
      stream.on('data', function () {
        var resultBuffer = fs.readFileSync(outputFolder + '/cucumber_report.html');        
        assert.equal(resultBuffer.toString(), expectedReportBuffer.toString());
      });
      
      stream.on('end', function() {
        done();
      });
      
      stream.write(jsonFile);
      stream.end();      
    });
    
    it('should create seperate reports for each file buffer', function(done) {
      var stream = reporter({
        dest: 'output'
      });

      var jsonFile1 = createFile('./data/cucumber_report1.json');
      var jsonFile2 = createFile('./data/cucumber_report2.json');

      var expectedReportBuffer = fs.readFileSync(path.join(__dirname, './data/expected_report.html'));
          
      stream.on('data', function (newFile) {
        var fileName = path.basename(newFile.path, '.json');
        
        var resultBuffer = fs.readFileSync(outputFolder + '/' + fileName + '.html');        
        assert.equal(resultBuffer.toString(), expectedReportBuffer.toString());
      });
      
      //assert two files were created
      stream.on('end', function() {        
        done();              
      });
      
      stream.write(jsonFile1);
      stream.write(jsonFile2);
      stream.end();
    });
  });
});