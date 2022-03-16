//Modules Needed
const express = require('express'),
  bodyParser = require('body-parser'),
  moment = require('moment'),
  Filter = require('bad-words'),
  filter = new Filter(),
  //Helper
  airtableHelper = require('./JS_Helper/AIRTABLE_HELPER'),
  rico = require('./JS_Helper/RICOCHET_HELPER'),
  mailer = require('./JS_Helper/EMAIL_NOTIFICATION')
//Scripts

const Airtable = require('airtable')
const config = require('config')

const base = new Airtable({ apiKey: config.get('airtableApiKey') }).base(
  config.get('airtableBase')
)

const airtableSearch = async (table, filterFormula, scrubbingView) => {
  try {
    const records = await base(table)
      .select({
        //Change filter params
        filterByFormula: filterFormula,
        view: scrubbingView,
      })
      .all()
    return records
  } catch (error) {
    console.log(error)
  }
}

const airtableUpdate = async (table, recordId, data) => {
  try {
    const recordUpdate = await base(table).update([
      {
        id: recordId,
        fields: data,
      },
    ])
    return recordUpdate
  } catch (error) {
    console.log(error)
  }
}

const airtableCreate = async (table, data) => {
  try {
    const newRecord = await base(table).create([
      {
        fields: data,
      },
    ])
    return newRecord
  } catch (error) {
    console.log(error)
  }
}

app = express()

app.use(bodyParser.json())

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

//SLS Origination
app.post('/SLS/SMS/origination', (req, res) => {
  let phoneNumberFormatted = req.body.phone.slice(2)
  let message, tag

  let assignees = [],
    campaignName = req.body.campaign.name
  console.log(req.body)

  //set message variable based on type
  if (req.body.message.type === 3) {
    message = req.body.message.body.split('\n')[0].replace(/(\[.*?\])/g, '')
  } else {
    message = req.body.message.body
  }

  //add Dan and Richard as the default assignees
  if (campaignName == 'Origination DR') {
    assignees = [{ name: 'Daniel McBride' }, { name: 'Richard Delrosario' }]
  }

  //tag equals campaign name
  tag = campaignName

  if (!filter.isProfane(message)) {
    console.log('No profane language found')
    airtableHelper
      .airtableSearch(
        //search Inbound Leads by Phone Number
        phoneNumberFormatted,
        '{Mobile Phone Formatted}',
        'Inbound Leads'
      )
      .then((response) => {
        if (response === undefined) {
          //if no record found then create Inbound Lead with customer response
          console.log('undefined')
          data = {
            fields: {
              'Customer Response': message,
              Email: req.body.email,
              'Merchant First Name': req.body.first_name,
              'Merchant Last Name': req.body.last_name,
              'Mobile Phone': phoneNumberFormatted,
              'Company Name': req.body.company_name,
              'Agent Status': 'New Lead',
              'Processing Status': 'New Lead',
              'Tag (Vendor)': req.body.Vendor,
              'Lead Source (iMerchant Lead Source)': req.body['Lead Source'],
              'Lead Type (Vehicle)': tag,
              'Primary Asignee': assignees,
            },
          }
          airtableHelper.airtableCreate(data, 'Inbound Leads')
        } else {
          //if already in Inbound Leads create new Inbound Lead with
          console.log('defined')
          data = {
            fields: {
              'Customer Response': message,
              Email: req.body.email,
              'Merchant First Name': req.body.first_name,
              'Merchant Last Name': req.body.last_name,
              'Mobile Phone': phoneNumberFormatted,
              'Company Name': req.body.company_name,
              'Agent Status': 'New Lead',
              'Processing Status': 'New Lead',
              'Tag (Vendor)': req.body.Vendor,
              'Lead Source (iMerchant Lead Source)': req.body['Lead Source'],
              'Lead Type (Vehicle)': tag,
              'Primary Asignee': response.fields['Primary Asignee'],
            },
          }
          airtableHelper.airtableCreate(data, 'Inbound Leads')
        }
      })
  }
  res.status(200).end()
})

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

// RICOCHET TO AIRTABLE
app.get('/api/create', function (req, res) {
  try {
    // Deconstruct object from Ricochet
    let {
      companyName,
      assignee,
      uploadDate,
      phone,
      address,
      city,
      state,
      zip,
      leadSource,
      firstName,
      lastName,
      email,
    } = req.query

    // Remove 1 from the beginning of the phone number
    phone = phone.slice(1)
    //phone = 6159276039

    // Merchant Records Scrubbing tool table check using Phone Number
    const dupRecordCheck = await airtableSearch(
      'Merchant Records',
      `OR({Business Phone Text} = ${phone}, {Owner 1 Mobile Text} = ${phone})`,
      'Scrubbing Tool'
    )

    // If records is found
    if (dupRecordCheck?.length > 0) {
      return res.send(`This Lead is a Dup Block`)
    }

    // Inbound Leads Scrubbing tool table check using Phone Number
    const dupRecordCheckInbound = await airtableSearch(
      'Inbound Leads',
      `OR({Mobile Phone Formatted} = ${phone}, {Business Phone Formatted} = ${phone})`,
      'Scrubbing Tool'
    )

    // If records is found
    if (dupRecordCheckInbound?.length > 0) {
      return res.send(`This Lead is a Dup Block`)
    }

    // Find Assignee in Agent Table off Ricochet Assignee
    const findAssignees = await airtableSearch(
      'Agent Table',
      `{Email} = '${assignee}'`,
      'Grid view'
    )

    // Change Assignee to Name instead of email
    assignee = [findAssignees[0].fields.Name]

    // Combine all Assignees necessary
    if (findAssignees[0].fields.hasOwnProperty('Chaser'))
      assignee = assignee.concat(findAssignees[0].fields.Chaser)
    if (findAssignees[0].fields.hasOwnProperty('Senior')) {
      assignee = assignee.concat(findAssignees[0].fields.Senior)
    }

    // Create an array to be used for Assignee
    let assigneeArray = []

    // Loop through each assignee and get there IDs
    for (let index = 0; index < assignee.length; index++) {
      const findAssignee = await airtableSearch(
        'Agent Table',
        `{Name} = '${assignee[index]}'`,
        'Grid view'
      )
      assigneeArray.push(findAssignee[0].id)
    }

    // Find Lead Source Id based off lead Source Name
    const leadSourceSearch = await airtableSearch(
      'Lead Source',
      `{Lead Source} = '${leadSource}'`,
      'Grid view'
    )

    // Assign Lead Source Id to leadSource
    leadSource = leadSourceSearch[0].id

    //  Create Object to send to Airtable
    const airtableLead = {
      'Legal Name': companyName,
      // Passing Assignee ID
      Assignees: assigneeArray,
      'Primary Assignee': [findAssignees[0].id],
      'Upload Date': uploadDate,
      'Business Phone': phone.toString(),
      'Business Address': address,
      'Business Zip': zip,
      'Business City': city,
      'Business State': state,
      'Lead Source': [leadSource],
      // ID for Dialer
      'Marketing Method': ['rec8xeFAHTpPr6tYs'],
      'Merchant 1 Full Name': `${firstName} ${lastName}`,
      'Email 1': email,
    }

    // Checks to see if lead exists prior to creating a new lead
    const updateRecordCheck = await airtableSearch(
      'Merchant Records',
      `OR({Business Phone Text} = ${phone}, {Owner 1 Mobile Text} = ${phone})`,
      'Grid view'
    )

    // If records is found to bed updated
    if (updateRecordCheck?.length > 0) {
      //console.log(updateRecordCheck[0].fields)
      const updatedLead = await airtableUpdate(
        'Merchant Records',
        updateRecordCheck[0].id,
        airtableLead
      )
      return res.send(`Lead Updated! MID is ${updatedLead[0].fields.MID}`)
    }

    airtableCreate('Merchant Records', airtableLead)

    res.json(`New Lead Created`)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

function Recycle() {
  airtableHelper.airtableSearch5().then((response) => {
    response.forEach((jsdata) => {
      //console.log(jsdata.fields.Status);
      if (
        jsdata.fields.Status == 'Submitted' ||
        jsdata.fields.Status == 'Approved' ||
        jsdata.fields.Status == 'Contracts Out' ||
        jsdata.fields.Status == 'Contracts In'
      ) {
        var data = {
          MID: jsdata.fields.MID,
          'Company Name': jsdata.fields['Legal Name'],
          'First Name': jsdata.fields['Merchant 1 Full Name'],
          Phone: jsdata.fields['Business Phone'],
          Email: jsdata.fields['Email 1'],
        }

        //console.log(jsdata.fields.Assignees);

        if (jsdata.fields.Assignees.includes('recqDyJZU3biJoVoy')) {
          //if Joe Davino is included
          console.log(jsdata)
          const postingto =
            'https://leads.ricochet.me/api/v1/lead/create/Recycle-Senior?token=1ef9c4efa09e3cb6d9a31a435f711997'
          rico.RicoPostNewLead(postingto, data).then((response) => {
            if (response.message != 'Duplicate') {
              rico.RicoUpdateTag(response.lead_id, 'Recycle Senior API')
            }
          })
        } else {
          const postingto =
            'https://leads.ricochet.me/api/v1/lead/create/Recycle-Seniors?token=1ef9c4efa09e3cb6d9a31a435f711997'
          rico.RicoPostNewLead(postingto, data).then((response) => {
            if (response.message != 'Duplicate') {
              rico.RicoUpdateTag(response.lead_id, 'Recycle Seniors API')
            }
          })
        }
      } else if (jsdata.fields.Status == 'App Out') {
        var data = {
          MID: jsdata.fields.MID,
          'Company Name': jsdata.fields['Legal Name'],
          'First Name': jsdata.fields['Merchant 1 Full Name'],
          Phone: jsdata.fields['Business Phone'],
          Email: jsdata.fields['Email 1'],
        }
        const postingto =
          'https://leads.ricochet.me/api/v1/lead/create/Power-Hour?token=1ef9c4efa09e3cb6d9a31a435f711997'
        rico.RicoPostNewLead(postingto, data).then((response) => {
          if (response.message != 'Duplicate') {
            rico.RicoUpdateTag(response.lead_id, 'Power Hour API')
          }
        })
      }
    })
  })
}
//Recycle();
setInterval(Recycle, 1000 * 60 * 60 * 24) //every 24 hours

function fn60sec() {
  airtableHelper.airtableSubstatus()
}
//fn60sec();
setInterval(fn60sec, 60 * 1000) //every minute

//UPDATE RICOCHET TAG
app.post('/RicoTagUpdate', (req, res) => {
  rico.RicoUpdateTag(req.body.id, req.body.tag)
  res.sendStatus(200).end()
})

//SEND SHM SMS RESPONSE TO SARAH
app.post('/SHM/SMS', (req, res) => {
  if (!filter.isProfane(req.body.message.body)) {
    mailer.sendNotifications(
      'sjuaidi@straighthomemortgage.com',
      `New SHM Positive SMS Response by ${req.body.first_name} ${req.body.last_name} from number ${req.body.phone}`,
      `First Name: ${req.body.first_name}
      Last Name: ${req.body.last_name}
      Phone Number: ${req.body.phone}
      State: ${req.body.state}
      City: ${req.body.city}
      MESSAGE: ${req.body.message.body}`
    )
  }
  res.status(200).end()
})

//SEND SHM EMAIL RESPONSE TO SARAH
app.post('/SHM/EMAIL', (req, res) => {
  console.log(req.body)
  let emailBody = req.body.message.body.split('\n')[0].replace(/(\[.*?\])/g, '')
  if (!filter.isProfane(emailBody)) {
    mailer.sendNotifications(
      'sjuaidi@straighthomemortgage.com',
      `New SHM Positive Email Response by ${req.body.first_name} ${req.body.last_name} from number ${req.body.phone}`,
      `First Name: ${req.body.first_name}
        Last Name: ${req.body.last_name}
        Phone Number: ${req.body.phone}
        State: ${req.body.state}
        City: ${req.body.city}
        MESSAGE: ${emailBody}`
    )
  }
  res.status(200).end()
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
