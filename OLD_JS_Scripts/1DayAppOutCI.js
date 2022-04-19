//This is a function to pull from iMerchant database using any query
const mssql = require('../JS_Helper/MSSQL_SEARCH'),
  //This pulls functions that help ricochet such as, Ricochet Tag Update & Ricochet Search, and Ricochet Create
  ricochetHelper = require('../JS_Helper/RICOCHET_HELPER'),
  axios = require('axios'),
  emailNotifications = require('../JS_Helper/EMAIL_NOTIFICATION'),
  { Parser } = require('json2csv'),
  //Moment date formatter module
  moment = require('moment');

var fromToday = moment(Date.now()).subtract(2, 'days').format('YYYY-MM-DD'),
  toToday = moment(Date.now()).subtract(1, 'days').format('YYYY-MM-DD');
//console.log(fromToday + ' ' + toToday)

var BaseAppLink = 'https://straightlinesource.com/apply/?fundingspecialist=',
  /*This query looks at the vwAssignmentAndUpdates table and inner joins it with the Users, Businesses and QuickApps
    tables to join in the respective merchants information into the same table / query

    The fields I am pulling is as follows:
        MID from vwAssignmentsAndUpdates
        ContactName from Businesses
        ContactEmail from QuickApps
        LeadClassName from vwAssignmentsAndUpdates
        Phone from QuickApps (or vwAssignmentsAndUpdates.[Business Phone] if no valid mobile found)
        AgentName from vwAssignmentsAndUpdates
        AgentEmail from Users
        AgentPhoneNumber from Users
    
    The inner join is joint to both Businesses and QuickApps by the MID
    
    The parameter for this query is if DateTime is between the start of the day and the end of the day*/

  query = `SELECT vw.MID AS MID, b.contactname AS ContactName, qa.homeemail AS ContactEmail, vw.[Lead Class Name] AS LeadClassName,
        CASE 
            WHEN qa.mobile IN ('', NULL) OR LEN(qa.mobile) < 10 THEN vw.[Business Phone]
            ELSE qa.mobile END AS Phone,
        vw.[Primary Assignee Name] AS AgentName, u.email AS AgentEmail, u.phone AS AgentPhoneNumber
        FROM vwAssignmentsAndUpdates AS vw
        INNER JOIN Users AS u ON u.show= 1 AND u.name = vw.[Primary Assignee Name]
        INNER JOIN Businesses AS b ON b.id = vw.MID
        INNER JOIN QuickApps AS qa ON qa.businessid = vw.MID
        WHERE [Update DateTime] BETWEEN '${fromToday}' AND '${toToday}'
        AND [New Status] = 'app out'
        ORDER BY [Update DateTime] DESC`;

function oneDayAppOutCI() {
  // What this function does is it pulls an mssqlSearch using the query displayed above and returns the data obtained 
  // (var is called response in this instance)
  mssql.mssqlSearch(query).then((response) => {
    let oneDayAppOutData = [];
    // For each statement to check if the response matches the following categories below
    response.forEach((jsdata) => {
      var values = {
        MID: jsdata.MID,
        'Contact Name': jsdata.ContactName,
        'Contact Email': jsdata.ContactEmail,
        'Lead Class Name': jsdata.LeadClassName,
        Phone: jsdata.Phone,
        'Agent Name': jsdata.AgentName,
        'Agent Email': jsdata.AgentEmail,
        'Agent Phone Number': jsdata.AgentPhoneNumber,
        'Agent Link': BaseAppLink + encodeURI(jsdata.AgentName),
      };
      if (jsdata.LeadClassName != 'SEO lead') {
        axios.post(
          'https://hooks.zapier.com/hooks/catch/3823316/buev77n/',
          values
        );
        oneDayAppOutData = oneDayAppOutData.concat(values);
      }
    });
    let csv = new Parser().parse(oneDayAppOutData); //json2csvParser
    emailNotifications.sendNotifications(
      'ehernandez@straightlinesource.com',
      '1DayAppOutCI',
      '1DayAppOutCI',
      '1DayAppOutCI',
      csv
    );
  });
}
//oneDayAppOutCI()
module.exports = oneDayAppOutCI;
