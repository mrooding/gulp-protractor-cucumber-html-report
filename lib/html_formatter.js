/**
 * Created by roberthilscher on 25.06.15.
 */


module.exports = (function () {

  var lodashTemplate = require('lodash.template'),
  path = require('path'),
  fs = require('fs'),
  statuses = {
    FAILED: 'failed',
    PASSED: 'passed',
    UNDEFINED: 'undefined',
    PENDING: 'pending',
    SKIPPED: 'skipped'
  },
  templates;

  /**
   * Convert html tags to html entites
   * @param str
   * @returns {XML|string|*|void}
   */
  function toHtmlEntities(str) {
    str = str || '';
    return str.replace(/./gm, function (s) {
      return "&#" + s.charCodeAt(0) + ";";
    });
  }

  /**
   * Checks if the step is an empty After step
   * @param step - object which contains step data
   * @returns boolean
   */
  function isEmptyAfterStep(step) {
    return step.keyword.trim() === 'After' && step.name === undefined && step.embeddings === undefined;
  }

  /**
   * Checks if the step is an empty Before step
   * @param step - object which contains step data
   * @returns boolean
   */
  function isEmptyBeforeStep(step) {
    return step.keyword.trim() === 'Before' && step.name === undefined && step.embeddings === undefined;
  }

  /**
   * Checks if the step is an After step containing a screenshot
   * @param step - object which contains step data
   * @returns boolean
   */
  function isAfterStepWithScreenshot(step) {
    return step.keyword.trim() === 'After'
      && step.embeddings
      && step.embeddings[0]
      && step.embeddings[0].mime_type === 'image/png';
  }

  /**
   * Return html code of step element based on step template
   * @param step - object which contains step data
   * @returns string
   */
  function getStep(step) {
    var template = fs.readFileSync(templates.stepTemplate),
    compiled = lodashTemplate(template.toString());

    return compiled({
      status: step.result ? step.result.status : '',
      errorDetails: step.result ? toHtmlEntities(step.result.error_message) : '',
      name: step.keyword + (step.name ? step.name : ''),
      dataTable: step.rows ? step.rows : ''
    });
  }


  /**
   * Return html code of step element based on step template
   * @param step - object which contains step data
   * @returns string
   */
  function getAfterScreenshotStep(step) {
    var template = fs.readFileSync(templates.screenshotTemplate),
    compiled = lodashTemplate(template.toString());

    return compiled({
      screenshot: step.embeddings && step.embeddings[0] ? step.embeddings[0].data : ''
    });
  }

  /**
   * Return html code of scenario element based on scenario template
   * @param scenario - object which contains step data
   * @param isPassed = flag which is true when all steps in scenario are passed otherwise is false
   * @returns string
   */
  function getScenario(scenario, isPassed) {
    var template = fs.readFileSync(templates.scenarioTemplate),
    compiled = lodashTemplate(template.toString());

    return compiled({
      status: isPassed ? statuses.PASSED : statuses.FAILED,
      name: scenario.keyword + ': ' + scenario.name
    });
  }

  /**
   * Return html code of feature element based on feature template
   * @param feature - object which contains feature data
   * @returns {*}
   */
  function getFeature(feature, scenariosNumberInFeature, passedScenariosNumberInFeature, stepsNumberInFeature, passedStepsInFeature) {
    var template = fs.readFileSync(templates.featureTemplate),
    compiled = lodashTemplate(template.toString());

    return compiled({
      name: feature.name,
      scenariosNumberInFeature: scenariosNumberInFeature,
      passedScenariosNumberInFeature: passedScenariosNumberInFeature,
      stepsNumberInFeature: stepsNumberInFeature,
      passedStepsInFeature: passedStepsInFeature
    });
  }

  /**
   * Return true when all steps is passed otherwise return false
   * @param scenariosNumber
   * @param passedScenarios
   * @returns {boolean}
   */
  function areTestsPassed(scenariosNumber, passedScenarios) {
    return (scenariosNumber === passedScenarios);
  }

  /**
   * Return header html code  based on header template
   * @param scenariosNumber
   * @param passedScenarios
   * @param stepsNumber
   * @param passedSteps
   * @returns {*}
   */
  function getHeader(scenariosNumber, passedScenarios, stepsNumber, passedSteps) {
    var template = fs.readFileSync(templates.headerTemplate),
    compiled = lodashTemplate(template.toString());

    return compiled({
      status: areTestsPassed(scenariosNumber, passedScenarios) ? 'passed' : 'failed',
      scenariosSummary: scenariosNumber + ' scenarios ' + '( ' + passedScenarios + ' passed)',
      stepsSummary: stepsNumber + ' steps ' + '( ' + passedSteps + ' passed)'
    });
  }

  /**
   * Generate html code which contains all elements needed to generate reports
   * @param testResults
   * @returns {string}
   */
  function generateHTML(testResults) {
    var stepsHtml = '',
    isPassed = false,
    passedScenarios = 0,
    passedSteps = 0,
    stepsNumber = 0,
    scenariosNumber = 0,
    html = '',
    step;

    for (var i = 0; i < testResults.length; i++) {
      var scenariosHtml = '',
      scenariosNumberInFeature = 0,
      passedScenariosNumberInFeature = 0,
      stepsNumberInFeature = 0,
      passedStepsInFeature = 0;

      if (testResults[i].elements) {
        for (var j = 0; j < testResults[i].elements.length; j++) {
          var element = testResults[i].elements[j];
          if (element.type === 'scenario' || element.keyword === 'Scenario') {
            scenariosNumber++;
            scenariosNumberInFeature++;
            stepsHtml = '';
            isPassed = true;
            for (var k = 0; k < testResults[i].elements[j].steps.length; k++) {
              step = testResults[i].elements[j].steps[k];

              if(isEmptyAfterStep(step) || isEmptyBeforeStep(step)) {
                continue;
              }

              if (isAfterStepWithScreenshot(step)) {
                stepsHtml += getAfterScreenshotStep(step);
              } else {
                stepsHtml += getStep(step);
                stepsNumber++;
                stepsNumberInFeature++;
                if (step.result.status !== statuses.PASSED) {
                  isPassed = false;
                } else if (step.result.status === statuses.PASSED) {
                  passedSteps++;
                  passedStepsInFeature++;
                }
              }
            }

            if (isPassed) {
              passedScenarios++;
              passedScenariosNumberInFeature++;
            }
            scenariosHtml += '<div class="scenario-container">' + getScenario(element, isPassed);
            scenariosHtml += stepsHtml + '</div>';
          }
        }
      }
      html += getFeature(testResults[i], scenariosNumberInFeature, passedScenariosNumberInFeature, stepsNumberInFeature, passedStepsInFeature);
      html += scenariosHtml;
    }
    header = getHeader(scenariosNumber, passedScenarios, stepsNumber, passedSteps);
    return header + html;
  }

  /**
   * Generate report from report template
   * @param html - concatenated all elements
   * @returns string which contains html code of report
   */
  function generateReport(html) {
    var template = fs.readFileSync(templates.reportTemplate),
    compiled = lodashTemplate(template.toString());

    return compiled({
      scenarios: html
    });
  }

  return {
    generateReport: function (testResults, htmlTemplates) {
      var html;
      templates = htmlTemplates;
      html = generateHTML(testResults);
      return generateReport(html);
    }
  };

}());
