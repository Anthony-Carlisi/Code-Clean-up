//This is a function to pull from iMerchant database using any query
const mssql = require('../JS_Helper/MSSQL_SEARCH'),
  axios = require('axios'),
  emailNotifications = require('../JS_Helper/EMAIL_NOTIFICATION'),
  { Parser } = require('json2csv'),
  moment = require('moment')

// function Recycle() {
//   airtableHelper.airtableSearch5().then((response) => {
//     response.forEach((jsdata) => {
//       //console.log(jsdata.fields.Status);
//       if (
//         jsdata.fields.Status == 'Submitted' ||
//         jsdata.fields.Status == 'Approved' ||
//         jsdata.fields.Status == 'Contracts Out' ||
//         jsdata.fields.Status == 'Contracts In'
//       ) {
//         var data = {
//           MID: jsdata.fields.MID,
//           'Company Name': jsdata.fields['Legal Name'],
//           'First Name': jsdata.fields['Merchant 1 Full Name'],
//           Phone: jsdata.fields['Business Phone'],
//           Email: jsdata.fields['Email 1'],
//         }

//         //console.log(jsdata.fields.Assignees);

//         if (jsdata.fields.Assignees.includes('recqDyJZU3biJoVoy')) {
//           //if Joe Davino is included
//           console.log(jsdata)
//           const postingto =
//             'https://leads.ricochet.me/api/v1/lead/create/Recycle-Senior?token=1ef9c4efa09e3cb6d9a31a435f711997'
//           rico.RicoPostNewLead(postingto, data).then((response) => {
//             if (response.message != 'Duplicate') {
//               rico.RicoUpdateTag(response.lead_id, 'Recycle Senior API')
//             }
//           })
//         } else {
//           const postingto =
//             'https://leads.ricochet.me/api/v1/lead/create/Recycle-Seniors?token=1ef9c4efa09e3cb6d9a31a435f711997'
//           rico.RicoPostNewLead(postingto, data).then((response) => {
//             if (response.message != 'Duplicate') {
//               rico.RicoUpdateTag(response.lead_id, 'Recycle Seniors API')
//             }
//           })
//         }
//       } else if (jsdata.fields.Status == 'App Out') {
//         var data = {
//           MID: jsdata.fields.MID,
//           'Company Name': jsdata.fields['Legal Name'],
//           'First Name': jsdata.fields['Merchant 1 Full Name'],
//           Phone: jsdata.fields['Business Phone'],
//           Email: jsdata.fields['Email 1'],
//         }
//         const postingto =
//           'https://leads.ricochet.me/api/v1/lead/create/Power-Hour?token=1ef9c4efa09e3cb6d9a31a435f711997'
//         rico.RicoPostNewLead(postingto, data).then((response) => {
//           if (response.message != 'Duplicate') {
//             rico.RicoUpdateTag(response.lead_id, 'Power Hour API')
//           }
//         })
//       }
//     })
//   })
// }
// //Recycle();
// setInterval(Recycle, 1000 * 60 * 60 * 24) //every 24 hours

// function fn60sec() {
//   airtableHelper.airtableSubstatus()
// }
// //fn60sec();
// setInterval(fn60sec, 60 * 1000) //every minute

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
        ORDER BY [Update DateTime] DESC`

function oneDayAppOutRemoval() {
  mssql.mssqlSearch(query).then((response) => {
    response.forEach((jsdata) => {
      var values = {
        'Contact Name': jsdata.ContactName,
        'Contact Email': jsdata.ContactEmail,
        Phone: jsdata.Phone,
      }
      axios.post(
        'https://hooks.zapier.com/hooks/catch/3823316/bukkj8p/',
        values
      )
    })
    let csv = new Parser().parse(response) //json2csvParser
    emailNotifications.sendNotifications(
      'ehernandez@straightlinesource.com',
      '1DaySubsConsCIRemoval',
      '1DaySubsConsCIRemoval',
      '1DaySubsConsCIRemoval',
      csv
    )
  })
}
//oneDayAppOutRemoval()
module.exports = oneDayAppOutRemoval
