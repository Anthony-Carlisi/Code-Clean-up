const jsforce = require('jsforce')
const express = require('express')
const router = express.Router()
const config = require('config')

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
      console.log('logged in')
    }
  }
)


//post lead to Salesforce
router.post('/', async (req, res) => {
  console.log(req.body)
  try {
    let {
      recordID,
      createdDate,
      leadOwnerEmail,
      company,
      email,
      mobile,
      firstName,
      lastName,
      streetAddress,
      city,
      state,
      zip,
      dba,
      phone,
      vendor,
      leadSource,
      campaignID,
      marketingMethod,
      purchaseDate
    } = req.body

    console.log(req.body)

    //search for agents userID
    let userID = await conn.query(
      `SELECT id FROM User WHERE email = '${leadOwnerEmail}'`,
      (err, result) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Total user records: ' + result.totalSize)
          return result.records[0].Id
        }
      }
    )

    // console.log('User ID: ' + userID)

    //create lead object
    await conn.sobject('Lead').create(
      {
        FirstName: firstName,
        LastName: lastName,
        phone: phone,
        MobilePhone: mobile,
        company: company,
        OwnerId: userID,
        street: streetAddress,
        city: city,
        state: state,
        PostalCode: zip.substring(0, 5),
        email: email,
        McaApp__DBA_Name__c: dba,
        CreatedDate: createdDate,
        LeadSource: "Inbound Leads",
        ricoVendor__c: vendor,
        ricoLeadSource__c: leadSource,
        CampaignID__c: campaignID,
        ricoMarketingMethod__c: marketingMethod[0],
        ricoUploadDate__c: purchaseDate,
        airtableRecId__c: recordID
      },
      function (err, ret) {
        if (err || !ret.success) return console.error(err, ret)
        console.log('Created record id : ' + ret.id)
      }
    )

    res.send('Your lead has been created in Salesforce.')
  } catch (error) {
    if (error.name == 'DUPLICATES_DETECTED') {
    //   res.status(900).send('You are creating a DUPLICATE record in Salesforce')
      res.status(418).send('You are creating a DUPLICATE record in Salesforce')
    } else {
      res.status(400).send(error) //probably an input error
    }
  }
  //   res.send('End of post')
})


module.exports = router
