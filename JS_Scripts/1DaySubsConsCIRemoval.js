//This is a function to pull from iMerchant database using any query
const mssql = require('../JS_Helper/MSSQL_SEARCH'),
  axios = require('axios'),
  emailNotifications = require('../JS_Helper/EMAIL_NOTIFICATION'),
  { Parser } = require('json2csv'),
  moment = require('moment');

var fromToday = moment(Date.now()).subtract(2, 'days').format('YYYY-MM-DD'),
  toToday = moment(Date.now()).subtract(1, 'days').format('YYYY-MM-DD'),
  query = `SELECT b.contactname AS ContactName, qa.homeemail AS ContactEmail,
    CASE
        WHEN qa.mobile IN ('', NULL) OR LEN(qa.mobile) < 10 THEN vw.[Business Phone]
        ELSE qa.mobile END AS Phone
    FROM vwAssignmentsAndUpdates AS vw
    INNER JOIN Users AS u ON u.show= 1 AND u.name = vw.[Primary Assignee Name]
    INNER JOIN Businesses AS b ON b.id = vw.MID
    INNER JOIN QuickApps AS qa ON qa.businessid = vw.MID
        WHERE vw.[Update DateTime] BETWEEN '${fromToday}' AND '${toToday}' AND vw.[New Status] NOT IN ('app out', 'new lead')
        ORDER BY [Update DateTime] DESC`;

function oneDayAppOutRemoval() {
  mssql.mssqlSearch(query).then((response) => {
    response.forEach((jsdata) => {
      var values = {
        'Contact Name': jsdata.ContactName,
        'Contact Email': jsdata.ContactEmail,
        Phone: jsdata.Phone,
      };
      axios.post(
        'https://hooks.zapier.com/hooks/catch/3823316/bukkj8p/',
        values
      );
    });
    let csv = new Parser().parse(response); //json2csvParser
    emailNotifications.sendNotifications(
      'ehernandez@straightlinesource.com',
      '1DaySubsConsCIRemoval',
      '1DaySubsConsCIRemoval',
      '1DaySubsConsCIRemoval',
      csv
    );
  });
}
//oneDayAppOutRemoval()
module.exports = oneDayAppOutRemoval;
