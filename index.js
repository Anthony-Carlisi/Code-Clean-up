//Modules Needed
const express = require('express'),
  bodyParser = require('body-parser'),
  axios = require('axios'),
  moment = require('moment'),
  schedule = require('node-schedule'),
  Filter = require('bad-words'),
  filter = new Filter(),
  //Helper
  airtableHelper = require('./JS_Helper/AIRTABLE_HELPER'),
  rico = require('./JS_Helper/RICOCHET_HELPER'),
  mailer = require('./JS_Helper/EMAIL_NOTIFICATION'),
  //Scripts

  app = express();

app.use(bodyParser.json());

filter.addWords(
  'not interested',
  'get lost',
  "don't own a business",
  'all good',
  'go away',
  "I'm good",
  'not needed',
  'retired',
  'i do not recognize this number',
  'all set',
  'leave me alone',
  'no thanks',
  'die',
  'do not contact',
  'spam',
  'no thank you',
  "don't have good credit",
  'not in the market',
  'get me off your list',
  'never contact me',
  "don't need financing",
  'not looking',
  'do not call',
  'stop',
  'no interest',
  "don't text ever again",
  'remove',
  'stop messaging',
  'this is not a business',
  'stop texting',
  'quit texting',
  'take me off your list',
  'delete',
  'DND',
  'DNC',
  'the number you are sending an SMS to',
  'wrong person',
  "sorry, can't talk right now",
  'this phone number is no longer in service',
  'never showed interest',
  'opt out ',
  'wrong number',
  'we never spoke',
  "Don't Bother"
);

app.post('/SLS/SMS/origination', (req, res) => {
  res.status(200).end();
  let phoneNumberFormatted = req.body.phone.slice(2);
  if (filter.isProfane(req.body.message.body)) {
    console.log('Profane language found');
  } else {
    console.log('No profane language found');
    airtableHelper
      .airtableSearch(
        phoneNumberFormatted,
        '{Mobile Phone Formatted}',
        'Inbound Leads'
      )
      .then((response) => {
        if (response === undefined) {
          console.log('undefined');
          data = {
            fields: {
              'Customer Response': req.body.message.body,
              Email: req.body.email,
              'Merchant First Name': req.body.first_name,
              'Merchant Last Name': req.body.last_name,
              'Mobile Phone': phoneNumberFormatted,
              'Company Name': req.body.company_name,
              'Agent Status': 'New Lead',
              'Processing Status': 'New Lead',
              'Tag (Vendor)': req.body.Vendor,
              'Lead Source (iMerchant Lead Source)': req.body['Lead Source'],
              'Lead Type (Vehicle)': 'SMS Lead',
            },
          };
          airtableHelper.airtableCreate(data, 'Inbound Leads');
        } else {
          console.log('defined');
          data = {
            'Customer Response':
              response.fields['Customer Response'] +
              ' \n ' +
              req.body.message.body,
          };
          airtableHelper.airtableUpdate(data, response.id, 'Inbound Leads');
        }
      });
  }
});

app.post('/WP/SMS/origination', (req, res) => {
  res.status(200).end();
  let phoneNumberFormatted = req.body.phone.slice(2);
  if (filter.isProfane(req.body.message.body)) {
    console.log('Profane language found');
  } else {
    console.log('No profane language found');
    airtableHelper
      .airtableSearch(
        phoneNumberFormatted,
        '{Mobile Phone Formatted}',
        'Inbound Leads'
      )
      .then((response) => {
        if (response === undefined) {
          console.log('undefined');
          data = {
            fields: {
              'Customer Response': req.body.message.body,
              Email: req.body.email,
              'Merchant First Name': req.body.first_name,
              'Merchant Last Name': req.body.last_name,
              'Mobile Phone': phoneNumberFormatted,
              'Company Name': req.body.company_name,
              'Agent Status': 'New Lead',
              'Processing Status': 'New Lead',
              'Tag (Vendor)': req.body.Vendor,
              'Lead Source (iMerchant Lead Source)': req.body['Lead Source'],
              'Lead Type (Vehicle)': 'SMS We Process',
            },
          };
          airtableHelper.airtableCreate(data, 'Inbound Leads');
        } else {
          console.log('defined');
          data = {
            'Customer Response':
              response.fields['Customer Response'] +
              ' \n ' +
              req.body.message.body,
          };
          airtableHelper.airtableUpdate(data, response.id, 'Inbound Leads');
        }
      });
  }
});

app.get('/api/create', function (req, res) {
  req.query['Business Phone'] = req.query['Business Phone'].slice(1);
  console.log(req.query);
});

app.post('/api/v4', function (req, res) {
  req.body.fields['Business Phone'] =
    req.body.fields['Business Phone'].slice(1);
  airtableHelper
    .airtableDupBlockSearch(req.body.fields['Business Phone'])
    .then((res) => {
      if (res === 'Dup Block') {
        console.log('Dup Block');
      } else if (res) {
        console.log('lead updated');
        airtableHelper
          .airtableSearch(req.body.fields.Assignees, '{Email}', 'Agent Table')
          .then((res1) => {
            req.body.fields.Assignees = [res1.id];
            console.log(res.id);
            airtableHelper.airtableUpdate(req.body, res.id, 'Inbound Leads');
            rico
              .RicoAppOutDupBlock(req.body.fields['Business Phone'])
              .then((response) => console.log(response));
          });
      } else {
        console.log('Lead Created');
        airtableHelper
          .airtableSearch(req.body.fields.Assignees, '{Email}', 'Agent Table')
          .then((res2) => {
            console.log(res2);
            req.body.fields.Assignees = [res2.id];
            airtableHelper.airtableCreate(req.body, 'Merchant Records');
            rico
              .RicoAppOutDupBlock(req.body.fields['Business Phone'])
              .then((response) => console.log(response));
          });
      }
    });
  res.status(200).send('API Completed');
});

app.get('/api/v3', function (req, res) {
  var data = {
    RequestHeader: {
      ApiUserId: '1cab6475-0bbe-4310-95b5-0952db046c3f',
      ApiPassword: 'SLS_49146ed',
      RequestId: '',
      ClassOverride: '',
    },
    Business: {
      SelfReportedCashFlow: {
        AnnualRevenue: '0',
        MonthlyAverageCreditCardVolume: '0',
      },
      Address: {
        Address1: '',
        City: '',
        State: '',
        Zip: '',
      },
      Name: '',
      TAG: '',
      Status: 'app out',
      Assignee: '',
      UploadDate: '',
      Phone: '',
    },
    Owners: [
      {
        HomeAddress: {
          Address1: '',
          City: '',
          State: '',
          Zip: '',
        },
        Name: '' + ' ' + '',
        FirstName: '',
        LastName: '',
        Email: '',
        DateOfBirth: '',
        HomePhone: '',
      },
    ],
    ApplicationData: {
      StatedCreditHistory: '0',
    },
  };

  for (var i = 0; i < Object.keys(req.query).length; i++) {
    if (data.RequestHeader.hasOwnProperty(Object.keys(req.query)[i])) {
      data.RequestHeader[Object.keys(req.query)[i]] = Object.values(req.query)[
        i
      ];
    } else if (data.Business.hasOwnProperty(Object.keys(req.query)[i])) {
      data.Business[Object.keys(req.query)[i]] = Object.values(req.query)[i];
    } else if (
      data.Business.Address.hasOwnProperty(Object.keys(req.query)[i])
    ) {
      data.Business.Address[Object.keys(req.query)[i]] = Object.values(
        req.query
      )[i];
    } else if (data.Owners[0].hasOwnProperty(Object.keys(req.query)[i])) {
      data.Owners[0][Object.keys(req.query)[i]] = Object.values(req.query)[i];
    } else if (
      data.Owners[0].HomeAddress.hasOwnProperty(Object.keys(req.query)[i])
    ) {
      data.Owners[0].HomeAddress[Object.keys(req.query)[i]] = Object.values(
        req.query
      )[i];
    } else {
      console.log(Object.keys(req.query)[i] + ' Key not Found');
    }
  }
  data.Owners[0].Name =
    data.Owners[0].FirstName + ' ' + data.Owners[0].LastName;

  if (data.Business.Phone.length > 10) {
    data.Business.Phone = data.Business.Phone.slice(1);
  }
  //console.log(req.query)
  data.Business.TAG = data.Business.TAG.replace(/-/g, ' ') + ',Dialer';

  // async function singleDupBlockSearch(toSearch) {
  //     var query = `select a.MID, a.[Business Name] AS companyName, Businesses.contactname AS firstName, a.Status AS statusAt, LEFT([Team Name], CHARINDEX('/', [Team Name]) - 1) AS senior, u.email as seniorEmail, Phone = CASE WHEN QuickApps.mobile IN('', NULL) OR LEN(QuickApps.mobile) < 10 THEN a.[Business Phone] ELSE QuickApps.mobile END from (select ROW_NUMBER() OVER(PARTITION BY MID ORDER BY [Update DateTime] DESC) as tt,* from vwAssignmentsAndUpdates)a INNER JOIN Businesses ON MID = Businesses.id INNER JOIN QuickApps ON MID = QuickApps.businessid INNER JOIN Users as u ON LEFT([Team Name], CHARINDEX('/', [Team Name]) - 1) = u.name where a.tt=1 AND (((a.Status = 'submitted' OR a.Status = 'approval' OR a.Status = 'contract out' OR a.Status = 'contract in') AND [Update DateTime] BETWEEN '${moment(Date.now()).subtract(45, 'days').format('YYYY-MM-DD')}' AND '${moment(Date.now()).format('YYYY-MM-DD')}') OR (a.Status = 'funded')) AND ([Business Phone] = '${toSearch}') ORDER BY CASE a.Status WHEN 'funded' THEN 1 WHEN 'contract out' THEN 2 WHEN 'contract in' THEN 3 WHEN 'approval' THEN 4 WHEN 'submitted' THEN 5 ELSE 6 END`
  //     let req = await mssql.mssqlSearch(query)
  //     return (req.length > 0 ? req : false)
  // }

  //singleDupBlockSearch(2396878505).then((response) => {
  // if (response != false) {
  //         var sendTo = response[0].seniorEmail + ',retention@straightlinesource.com'
  //         if (response[0].status === 'funded') {
  //             res.send(`In-House Funded! You have been blocked from working with this Merchant.`)
  //             console.log(sendTo)
  //             mailer.sendNotifications(
  //                 sendTo,
  //                 `Your Funded Merchant MID# ${response[0].MID} is Shopping! ${data.Business.Assignee} was just blocked from creating a CRM profile.`,
  //                 `<p><a href="https://sls.imerchantsystems.com/Default.aspx?b=${response[0].MID}" target="_blank">CRM LINK</a></p>`
  //             )
  //             rico.RicoAppOutDupBlock(data.Business.Phone).then(response => console.log(response))
  //         } else {
  //             res.send(`This Merchant is Actively working with another SLS Agent!`)
  //             mailer.sendNotifications(
  //                 response[0].seniorEmail,
  //                 `Your Merchant MID# ${response[0].MID} is Shopping! ${data.Business.Assignee} was just blocked from creating a CRM profile.`,
  //                 `<p><a href="https://sls.imerchantsystems.com/Default.aspx?b=${response[0].MID}" target="_blank">CRM LINK</a></p>`
  //             )
  //             rico.RicoAppOutDupBlock(data.Business.Phone).then(response => console.log(response))
  //         }
  //     } else {
  console.log(req.query);
  console.log(data);
  axios
    .post('https://wcfexternal80.imerchantsystems.com/', data)
    .then((ras) => {
      console.log(data);
      var test = JSON.stringify(ras.data),
        MID = test.replace(/[^0-9]/g, ''); // replace all leading non-digits with nothing
      mailer.sendNotifications(
        data.Business.Assignee,
        `New App Out Created, Your MID is ${MID}`,
        `<p><a href="https://sls.imerchantsystems.com/Default.aspx?b=${MID}" target="_blank">CRM LINK</a></p>`
      );
      res.redirect(`https://sls.imerchantsystems.com/Default.aspx?b=${MID}`);
      rico
        .RicoAppOutDupBlock(data.Business.Phone)
        .then((response) => console.log(response));
    })
    .catch((error) => {
      console.error(error);
    });
  // }

  //})
});

app.listen(process.env.PORT || 4000);
