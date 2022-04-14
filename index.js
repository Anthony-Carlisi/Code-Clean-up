//Modules Needed
const express = require('express'),
  Filter = require('bad-words'),
  filter = new Filter(),
  //Helper
  airtableHelper = require('./JS_Helper/AIRTABLE_HELPER'),
  rico = require('./JS_Helper/RICOCHET_HELPER')
//Scripts

// trying to work
const app = express()

app.use(express.json({ extended: false }))
app.use(
  express.urlencoded({
    extended: true,
  })
)
app.use('/api/create', require('./routes/api/create'))
app.use('/api/tokenScrub', require('./routes/api/tokenScrub'))
app.use('/api/upload', require('./routes/api/upload'))
app.use('/api/ricoToSalesforce', require('./routes/api/ricoToSalesforce'))
app.use(
  '/api/airtableToSalesforce',
  require('./routes/api/airtableToSalesforce')
)
// app.use('/api/test', require('./routes/api/test'))
app.use('/api/sfJotform', require('./routes/api/sfJotform'))
app.use('/api/popCrumbs', require('./routes/api/popCrumbs'))
app.use('/api/linkTracker', require('./routes/api/linkTracker'))
app.use('/api/sms', require('./routes/api/sms'))

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
)

//WeProcess Origination
app.post('/WP/SMS/origination', (req, res) => {
  console.log(req)
  res.status(200).end()
  let phoneNumberFormatted = req.body.phone.slice(2)
  if (filter.isProfane(req.body.message.body)) {
    console.log('Profane language found')
  } else {
    console.log('No profane language found')
    airtableHelper
      .airtableSearch3(
        phoneNumberFormatted,
        '{Mobile Phone Formatted}',
        'Inbound Leads'
      )
      .then((response) => {
        if (response === undefined) {
          console.log('undefined')
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
              'Lead Type (Vehicle)': 'ConnInc SMS We Process',
            },
          }
          airtableHelper.airtableCreate(data, 'Inbound Leads')
        } else {
          console.log('defined')
          data = {
            'Customer Response':
              response.fields['Customer Response'] +
              ' \n ' +
              req.body.message.body,
          }
          airtableHelper.airtableUpdate(data, response.id, 'Inbound Leads')
        }
      })
  }
})

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

//UPDATE RICOCHET TAG
app.post('/RicoTagUpdate', (req, res) => {
  rico.RicoUpdateTag(req.body.id, req.body.tag)
  res.sendStatus(200).end()
})

//ADD CCoupons LEADS TO INBOUND LEADS
app.post('/SMS/ORIGINATION', (req, res) => {
  //  console.log(req);
  // mailer.sendNotifications(
  //   'irakli@ccoupons.com',
  //   `API Testing Straight Line Source`,
  //   JSON.stringify(req.body)
  // );
  console.log(req)

  let phoneNumberFormatted = req.body.From.slice(2)
  if (!filter.isProfane(req.body.Body)) {
    airtableHelper
      .airtableSearch(
        //search AT
        phoneNumberFormatted,
        '{Mobile Phone Formatted}',
        'Inbound Leads'
      )
      .then((response) => {
        if (response === undefined) {
          //if number not found in Inbound Leads then create new as "CCoupons SMS Lead"
          data = {
            fields: {
              'Customer Response': req.body.Body,
              Email: req.body.extraDATA.email,
              'Merchant First Name': req.body.extraDATA.firstName,
              'Merchant Last Name': req.body.extraDATA.lastName,
              'Mobile Phone': phoneNumberFormatted,
              'Company Name': req.body.extraDATA.businessName,
              'Agent Status': 'New Lead',
              'Processing Status': 'New Lead',
              'Tag (Vendor)': req.body.extraDATA.vendor,
              'Lead Source (iMerchant Lead Source)':
                req.body.extraDATA.leadSource,
              'Purchase Date': new Date(req.body.extraDATA.uploadDate),
              'Lead Type (Vehicle)': 'CCoupons SMS Lead',
            },
          }
          airtableHelper.airtableCreate(data, 'Inbound Leads')
        } else {
          // if number already in Inbound Leads append "Customer Response" on new line
          console.log('defined')
          data = {
            fields: {
              'Customer Response': req.body.Body,
              Email: req.body.extraDATA.email,
              'Merchant First Name': req.body.extraDATA.firstName,
              'Merchant Last Name': req.body.extraDATA.lastName,
              'Mobile Phone': phoneNumberFormatted,
              'Company Name': req.body.extraDATA.businessName,
              'Agent Status': 'New Lead',
              'Processing Status': 'New Lead',
              'Tag (Vendor)': req.body.extraDATA.vendor,
              'Lead Source (iMerchant Lead Source)':
                req.body.extraDATA.leadSource,
              'Purchase Date': new Date(req.body.extraDATA.uploadDate),
              'Lead Type (Vehicle)': 'CCoupons SMS Lead',
              'Primary Asignee': response.fields['Primary Asignee'],
            },
          }

          console.log('defined')
          airtableHelper.airtableCreate(data, 'Inbound Leads')
        }
      })
  }

  res.status(200).end()
})

app.listen(process.env.PORT || 4000)
