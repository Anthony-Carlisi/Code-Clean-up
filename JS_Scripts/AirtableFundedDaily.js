const mssql = require('../JS_Helper/MSSQL_SEARCH'),
  airtableHelper = require('../JS_Helper/AIRTABLE_HELPER'),
  emailNotifications = require('../JS_Helper/EMAIL_NOTIFICATION'),
  { Parser } = require('json2csv'),
  moment = require('moment');

var Today = moment(Date.now()).format('YYYY-MM-DD'),
  From = moment(Date.now()).subtract(1, 'days').format('YYYY-MM-DD');

async function AirtableFundedDaily() {
  const table1 = 'Merchant Records';
  const field1 = '{MID}';

  const table2 = 'Funding Records';
  const field2 = '{Funding ID}';

  var query = `SELECT l.id AS FundingID, l.edate AS RecordEntryDate, l.businessid AS MID, u.name AS PrimaryAssignee, frd.[Team Name] AS Team,
        qa.mobile AS Mobile, qa.businessphone AS BusinessPhone, qa.legalname AS BusinessName, qa.homeemail AS Email, frd.Industry AS TypeofBusiness,
        frd.datefunded AS DateFunded, frd.lender AS Lender, l.amount AS FundedAmount, l.dailypayment AS DailyPayment, l.paybackamount AS TotalPayback, 
        frd.unittype AS FundedAdvanceType, qa.ownername AS MerchantFullName, qa.pstate AS State
        FROM Loans AS l
        INNER JOIN vwFundedReport_Details AS frd ON l.id = frd.id
        INNER JOIN Users as u ON frd.salesperson = u.email
        INNER JOIN QuickApps AS qa ON l.businessid = qa.businessid
        WHERE l.edate BETWEEN '${From}' AND '${Today}' ORDER BY l.edate DESC`;
  mssql
    .mssqlSearch(query)
    .then((loanResponse) => {
      //one array for Merchant Records and one for Funding Records
      let merchantRecordsData = [],
        fundingRecordsData = [];
      loanResponse.forEach((jsdata) => {
        airtableHelper
          .airtableSearch(jsdata.MID, field1, table1)
          .then((Response) => {
            if (Response === undefined) {
              var s = jsdata.Team;
              s = s.substring(0, s.indexOf('/'));
              var data1 = {
                fields: {
                  MID: jsdata.MID,
                  'Primary Assignee': jsdata.PrimaryAssignee,
                  'Secondary Assignee': s,
                  Team: s,
                  'Mobile Phone': jsdata.Mobile,
                  'Business Phone': jsdata.BusinessPhone,
                  'Business Name': jsdata.BusinessName,
                  Email: jsdata.Email,
                  'Processing Disposition': 'New Lead',
                  'Lead Source': 'SLS Funded',
                  'Type of Business': jsdata.TypeofBusiness,
                  'Merchant Full Name': jsdata.MerchantFullName,
                  State: jsdata.State,
                },
              };
              airtableHelper.airtableCreate(data1, table1);
              merchantRecordsData = merchantRecordsData.concat(data1.fields); //add new data to merchantRecordsData array
            }
          })
          .catch((error) => {
            console.error(error);
          });

        airtableHelper
          .airtableSearch(jsdata.FundingID, field2, table2)
          .then((Response) => {
            if (Response === undefined) {
              var dateTime1 = moment(jsdata.DateFunded).format('MM/DD/YYYY');
              var data2 = {
                fields: {
                  'Funding ID': jsdata.FundingID,
                  MID: jsdata.MID,
                  'Date Funded': dateTime1,
                  Lender: jsdata.Lender,
                  'Funded Amount': jsdata.FundedAmount,
                  'Daily Payment $': jsdata.DailyPayment,
                  'Total Payback $': jsdata.TotalPayback,
                  'Funded Advance Type': jsdata.FundedAdvanceType,
                },
              };
              airtableHelper.airtableCreate(data2, table2);
              fundingRecordsData = fundingRecordsData.concat(data2.fields); //add new data to fundingRecordsData array
            }
          })
          .catch((error) => {
            console.error(error);
          });
      });

      if (merchantRecordsData.length > 0) {
        //send Merchant Records
        let csv1 = new Parser().parse(merchantRecordsData); //json2csvParser
        emailNotifications.sendNotifications(
          'acarlisi@straightlinesource.com',
          'Merchant Records',
          'Merchant Records',
          'Merchant_Records',
          csv1
        );
      }

      if (fundingRecordsData.length > 0) {
        //send Funding Records
        let csv2 = new Parser().parse(fundingRecordsData); //json2csvParser
        emailNotifications.sendNotifications(
          'acarlisi@straightlinesource.com',
          'Funding Records',
          'Funding Records',
          'Funding_Records',
          csv2
        );
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

AirtableFundedDaily();
module.exports = AirtableFundedDaily;
