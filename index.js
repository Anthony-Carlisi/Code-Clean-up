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
      .airtableSearch3(
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
// Initial Breadcrumb URL
app.get('/api/create', function (req, res) {
  // Remove 1 from Phone Number EX (1)5163034649
  req.query['Business Phone'] = req.query['Business Phone'].slice(1);
  cleanedLead.fields = req.query;
  airtableHelper
    .airtableSearch2(
      req.query['Business Phone'],
      '{Business Phone Text}',
      'Merchant Records'
    )
    .then((merchantRecords) => {
      airtableHelper
        .airtableSearch2(req.query.Assignees, '{Email}', 'Agent Table')
        .then((userInfo) => {
          console.log(userInfo);
          req.query.Assignees = userInfo[0].fields.Name;
          if (!merchantRecords.length) {
            airtableHelper
              .airtableSearch2(
                req.query['Business Phone'],
                '{Mobile Phone Formatted}',
                'Inbound Leads'
              )
              .then((inbound) => {
                if (!merchantRecords.length) {
                  airtableHelper.airtableCreate(
                    cleanedLead,
                    'Merchant Records'
                  );
                  res.send(`New Lead Created`);
                  rico
                    .RicoAppOutDupBlock(req.query['Business Phone'])
                    .then((response) => console.log(response));
                } else {
                  for (jsdata of inbound) {
                    if (
                      (jsdata.fields['Lead Type (Vehicle)'] =
                        'SEO Lead' &&
                        jsdata.fields['Created Date'] <
                          moment(Date.now())
                            .subtract(90, 'days')
                            .format('YYYY-MM-DD'))
                    ) {
                      res.send(`This Lead is a Dup Block`);
                    } else {
                      airtableHelper.airtableCreate(
                        cleanedLead,
                        'Merchant Records'
                      );
                      res.send(`New Lead Created`);
                      rico
                        .RicoAppOutDupBlock(req.query['Business Phone'])
                        .then((response) => console.log(response));
                    }
                  }
                }
              });
          } else {
            for (jsdata of merchantRecords) {
              if (jsdata.fields.Assignees.includes(userInfo[0].id)) {
                res.send(
                  `This is already your deal please refer to MID ${jsdata.fields.MID}`
                );
                break;
              }
            }
            for (jsdata of merchantRecords) {
              if (
                jsdata.fields.Status === 'Funded' ||
                jsdata.fields['Status Change Date'] >
                  moment(Date.now()).subtract(90, 'days').format('YYYY-MM-DD')
              ) {
                res.send(`This Lead is a Dup Block`);
              } else {
                airtableHelper
                  .airtableUpdate(cleanedLead, jsdata.id, 'Merchant Records')
                  .then((response) => {
                    res.send(`Lead Reassignee to you ${response.fields.MID}`);
                  });
              }
            }
          }
        });
    });
});

app.listen(process.env.PORT || 4000);
