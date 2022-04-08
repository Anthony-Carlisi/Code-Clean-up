const jsforce = require('jsforce')
const express = require('express')
const router = express.Router()
const config = require('config')

initConnect = async () => {
  const conn = new jsforce.Connection({
    loginUrl: 'https://login.salesforce.com',
  })

  await conn.login(
    config.get('salesforceEmail'),
    config.get('salesforcePassword') + config.get('salesforceToken'),
    (err, userInfo) => {
      if (err) {
        console.log(err)
      }
    }
  )
}

router.get('/', async (req, res) => {
  try {
    let {
      recordID,
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
      industry,
      requestedAmount,
      dba,
      phone,
      vendor,
      leadSource,
    } = req.query

    console.log(leadOwnerEmail)

    //search for agents userID
    let userID = ''
    await conn.query(
      `SELECT id FROM User WHERE email = '${leadOwnerEmail}'`,
      (err, result) => {
        if (err) {
          console.log(err)
          res.send("Error in query")
        } else {
          console.log('Total user records: ' + result.totalSize)
          userID = result.records[0].Id
        }
      }
    )

    console.log("User ID: " + userID)

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
        McaApp__Amount_Requested__c: requestedAmount,
        industry: industry,
        // Lead_Vendor__c: vendor,
        // CampaignID__c: '7018c000000xC4PAAU',
        // LeadSource: 'Ricochet',
      },
      function (err, ret) {
        if (err || !ret.success) return console.error(err, ret)
        console.log('Created record id : ' + ret.id)
      }
    )

    res.send('Your lead has been created in Salesforce.')
  } catch (error) {
    if (error.name == 'DUPLICATES_DETECTED') {
      res.send('You are creating a DUPLICATE record in Salesforce')
    } else {
      res.send(error)
    }
  }
})

module.exports = router
