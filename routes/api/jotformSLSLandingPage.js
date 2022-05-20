const express = require('express')
const router = express.Router()
const jsforce = require('jsforce')
const config = require('config')
const multer = require('multer')
const emailNotifications = require('../../hooks/emailNotifications.js')
const dupBlockerCheck = require('../../hooks/dupBlockerCheck.js')
var upload = multer()

const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com',
})

conn.login(
  config.get('salesforceEmail'),
  config.get('salesforcePassword') + config.get('salesforceToken'),
  (err, userInfo) => {
    if (err) {
      console.log(err)
    } else {
    }
  }
)

// for parsing multipart/form-data => [https://stackoverflow.com/questions/56758241/node-js-express-how-to-get-data-from-body-form-data-in-post-request]
router.use(upload.array())
router.use(express.static('public'))

router.post('/', async (req, res) => {
  //   console.log(JSON.parse(req.body.rawRequest))

  let {
      q23_amountRequested: amountRequested,
      q6_startYear: startYear,
      q10_industry: industry,
      q7_accountType: accountType,
      q24_monthlyRevenue: monthlyRevenue,
      q26_creditScore: creditScore,
      q17_contactInfo: contactInfo,
      q20_marketingMethod: marketingMethod,
      q29_campaignID: campaignID,
    } = JSON.parse(req.body.rawRequest),
    firstName = contactInfo['field_1'],
    lastName = contactInfo['field_6'],
    company = contactInfo['field_3'],
    email = contactInfo['field_5'],
    phone = contactInfo['field_4'].replace(/[^0-9]/g, '').slice(-10)

  // console.log(JSON.parse(req.body.rawRequest))

  // return res.sendStatus(200)

  let group, leadSource
  if (marketingMethod == 'EMCA Email - LP') {
    group = 'Petar Email - LP'
    leadSource = 'Email'
    marketingMethod = 'Petar Email - LP'
  }

  //Airtable duplicate checking
  const dupCheckPhoneMerchant = await dupBlockerCheck.dupCheck(
    [phone],
    'Merchant Records',
    'phone'
  )

  const dupCheckEmailMerchant = await dupBlockerCheck.dupCheck(
    [email],
    'Merchant Records',
    'email'
  )

  const dupCheckPhoneInbound = await dupBlockerCheck.dupCheck(
    [phone],
    'Inbound Leads',
    'phone'
  )

  const dupCheckEmailInbound = await dupBlockerCheck.dupCheck(
    [email],
    'Inbound Leads',
    'email'
  )

  if (
    dupCheckPhoneMerchant?.length > 0 ||
    dupCheckEmailMerchant?.length > 0 ||
    dupCheckPhoneInbound?.length > 0 ||
    dupCheckEmailInbound?.length > 0
  ) {
    await emailNotifications.sendNotification(
      //send to marketing and accounting
      'marketing@straightlinesource.com',
      `SLS Landing Page Duplicate Lead: Already in Stacker`,
      JSON.stringify(JSON.parse(req.body.rawRequest), null, 2)
    )

    return res.send(`This Lead is a Dup Block`)
  }

  try {
    //create lead object
    await conn.sobject('Lead').create(
      {
        //Lead Info
        FirstName: firstName,
        LastName: lastName,
        phone: phone,
        company: company,
        email: email,
        McaApp__Credit_Score__c: creditScore,
        Industry: industry,
        McaApp__Amount_Requested__c: amountRequested,
        McaApp__Monthly_Gross_Sales__c: monthlyRevenue,
        McaApp__Years_in_Business__c: Math.round(
          (Date.now() - Date.parse(startYear)) / (1000 * 60 * 60 * 24 * 365)
        ),
        //Marketing
        LeadSource: leadSource,
        ricoMarketingMethod__c: marketingMethod,
        CampaignID__c: campaignID,
        //Round Robin
        Janati_RR__Round_Robin__c: 'Yes',
        Round_Robin_Assignment_Group__c: group,
      },
      function (err, ret) {
        if (err || !ret.success) return
        console.log('Created record id : ' + ret.id)
      }
    )

    res.sendStatus(200)
  } catch (error) {
    if (error.name == 'DUPLICATES_DETECTED') {
      console.error('jotformSLSLandingPage.js: Salesforce duplicate detected')
      await emailNotifications.sendNotification(
        'marketing@straightlinesource.com',
        `SLS Landing Page Duplicate Lead: Already in Salesforce`,
        JSON.stringify(JSON.parse(req.body.rawRequest), null, 2)
      )
      res.sendStatus(418)
    } else {
      console.error('jotformSLSLandingPage.js: ' + error)
      await emailNotifications.sendNotification(
        'marketing@straightlinesource.com',
        `Error Adding SLS Landing Page Lead to Salesforce`,
        error.name +
          ': ' +
          error.message +
          '\n' +
          JSON.stringify(JSON.parse(req.body.rawRequest), null, 2)
      )
      res.sendStatus(500)
    }
  }
})

module.exports = router