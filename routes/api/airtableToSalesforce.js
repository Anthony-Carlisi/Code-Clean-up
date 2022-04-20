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
  // console.log(req.body)
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
      purchaseDate,
    } = req.body

    //search for agents userID
    let userID = await conn.query(
      `SELECT id FROM User WHERE email = '${leadOwnerEmail[0]}'`,
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
        LeadSource: 'Inbound Leads',
        ricoVendor__c: vendor,
        ricoLeadSource__c: leadSource,
        CampaignID__c: campaignID,
        ricoMarketingMethod__c: marketingMethod,
        ricoUploadDate__c: purchaseDate,
        airtableRecId__c: recordID,
      },
      function (err, ret) {
        if (err || !ret.success) return console.error(err, ret)
        console.log('Created record id : ' + ret.id)
      }
    )

    res.send('Your lead has been created in Salesforce.')
  } catch (error) {
    if (error.name == 'DUPLICATES_DETECTED') {
      res.status(418).send('You are creating a DUPLICATE record in Salesforce')
    } else {
      res.status(900).send(error) //probably an input format error
    }
  }
  //   res.send('End of post')
})

//post VSS lead to Salesforce
router.post('/VSS', async (req, res) => {
  try {
    let {
      recordID,
      createdDate,
      leadOwnerEmail,
      leadOwnerName,
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
      purchaseDate,
    } = req.body

    // console.log(req.body)

    //search for agents userID
    let slsUser
    for (let i = 0; i < leadOwnerEmail.length; i++) {
      if (leadOwnerEmail[i] == 'mdell@slsbiz.com') leadOwnerEmail[i] = 'mdell@straightlinesource.com';
      if (leadOwnerEmail[i] == 'cbrumber@slsbiz.com') leadOwnerEmail[i] = 'cbrumber@straightlinesource.com';
      slsUser = await conn.query(
        `SELECT id FROM User WHERE email = '${leadOwnerEmail[i]}'`,
        (err, result) => {
          if (err) {
            console.log(err)
            return undefined
          } else {
            // console.log('Total user records: ' + result.totalSize)
            return result.totalSize == 0
              ? undefined
              : {
                  sfId: result.records[0].Id,
                  atIndex: i,
                  name: leadOwnerName[i],
                }
          }
        }
      )
      if (slsUser != undefined) {
        break
      } // if agent found break out of for loop
    }

    let vssAgentName =
      slsUser.atIndex == 0 ? leadOwnerName[1] : leadOwnerName[0]
    console.log('SLS User: ' + slsUser.name)
    console.log('VSS Agent: ' + vssAgentName)

    //create lead object
    await conn.sobject('Lead').create(
      {
        FirstName: firstName,
        LastName: lastName,
        phone: phone,
        MobilePhone: mobile,
        company: company,
        OwnerId: slsUser.sfId,
        street: streetAddress,
        city: city,
        state: state,
        PostalCode: zip.substring(0, 5),
        email: email,
        McaApp__DBA_Name__c: dba,
        CreatedDate: createdDate,
        LeadSource: 'VSS',
        Lead_Source_Detail__c: vssAgentName,
        ricoVendor__c: vendor,
        ricoLeadSource__c: leadSource,
        CampaignID__c: campaignID,
        ricoMarketingMethod__c: marketingMethod,
        ricoUploadDate__c: purchaseDate,
        airtableRecId__c: recordID,
      },
      function (err, ret) {
        if (err || !ret.success) return console.error(err, ret)
        console.log('Created record id : ' + ret.id)
      }
    )

    res.send('Your lead has been created in Salesforce.')
  } catch (error) {
    if (error.name == 'DUPLICATES_DETECTED') {
      res.status(418).send('You are creating a DUPLICATE record in Salesforce')
    } else {
      res.status(900).send(error) //probably an input format error
    }
  }
  // //   res.send('End of post')
})

module.exports = router
