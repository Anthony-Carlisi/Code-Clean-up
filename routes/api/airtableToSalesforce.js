const jsforce = require('jsforce')
const express = require('express')
const router = express.Router()
const airtableHelper = require('../../hooks/airtableHelper.js')
const emailNotifications = require('../../hooks/emailNotifications.js')
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

//post Non-VSS lead to Salesforce
router.post('/', async (req, res) => {
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

  try {

    //check if in Merchant Records duplicate list
    if (await isInMerchRecs([phone, mobile], req.body))
      return res.status(901).end()

    if (leadOwnerEmail[0] == 'mdell@slsbiz.com')
      leadOwnerEmail[0] = 'mdell@straightlinesource.com'
    if (leadOwnerEmail[0] == 'cbrumber@slsbiz.com')
      leadOwnerEmail[0] = 'cbrumber@straightlinesource.com'

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
        if (err || !ret.success) return
        console.log('Created record id : ' + ret.id)
      }
    )

    res.send('Your lead has been created in Salesforce.')
  } catch (error) {
    if (error.name == 'DUPLICATES_DETECTED') {
      console.error("Salesforce duplicate detected")
      await emailNotifications.sendNotification(
        leadOwnerEmail,
        `Your lead "${company}" is a duplicate in Salesforce and was not added`,
        `Phone: ${phone}\nMobile: ${mobile}\nEmail: ${email}`
      )
      res.status(418).end()
    } else {
      console.error(error.message)
      await emailNotifications.sendNotification(
        leadOwnerEmail,
        `There was a problem adding your lead "${company}"`,
        `ERROR: ${error.message}\n\nPhone: ${phone}\nMobile: ${mobile}\nEmail: ${email}`
      )
      res.status(900).end() //probably an input format error
    }
  }
})

//post VSS lead to Salesforce
router.post('/VSS', async (req, res) => {
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

  try {

    //check if in Merchant Records duplicate list
    if (await isInMerchRecs([phone, mobile], req.body))
      return res.status(901).end()

    //search for agents userID
    let slsUser
    for (let i = 0; i < leadOwnerEmail.length; i++) {
      //correct for emails
      if (leadOwnerEmail[i] == 'mdell@slsbiz.com')
        leadOwnerEmail[i] = 'mdell@straightlinesource.com'
      if (leadOwnerEmail[i] == 'cbrumber@slsbiz.com')
        leadOwnerEmail[i] = 'cbrumber@straightlinesource.com'

      //search for SLS user in SF
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
      if (slsUser != undefined) break //if SLS agent found break out of for loop
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
        if (err || !ret.success) return
        console.log('Created record id : ' + ret.id)
      }
    )

    res.send('Your lead has been created in Salesforce.')
  } catch (error) {
    if (error.name == 'DUPLICATES_DETECTED') {
      console.error("Salesforce duplicate detected")
      await emailNotifications.sendNotification(
        leadOwnerEmail,
        `Your lead "${company}" is a duplicate in Salesforce and was not added`,
        `Phone: ${phone}\nMobile: ${mobile}\nEmail: ${email}`
      )
      res.status(418).end()
    } else {
      console.error(error.message)
      // console.log(companyX, leadOwnerEmailX)
      await emailNotifications.sendNotification(
        leadOwnerEmail,
        `There was a problem adding your lead "${company}"`,
        `ERROR: ${error.message}\n\nPhone: ${phone}\nMobile: ${mobile}\nEmail: ${email}`
      )
      res.status(900).end() //probably an input format error
    }
  }
})

async function isInMerchRecs(phoneNumbers, query) {
  let duplicates = []

  for (let p of phoneNumbers) {
    if (p != '') {
      let result = await airtableHelper.airtableSearch(
        'Merchant Records',
        `OR({Business Phone Text} = ${p}, {Owner 1 Mobile Text} = ${p})`,
        'Scrubbing Tool'
      )

      // console.log(result)
      if (result.length > 0) {
        for (let res of result) {
          duplicates.push(res)
        }
      }
    }
  }

  // console.log(leadOwnerEmail)
  if (duplicates.length > 0) {
    await emailNotifications.sendNotification(
      query.leadOwnerEmail,
      `Your lead "${query.company}" is a duplicate in Stacker and was not added`,
      `Phone: ${query.phone}\nMobile: ${query.mobile}\nEmail: ${query.email}`
    )
    console.error('Duplicate found in Merchant Records')
    return true
  } else {
    return false
  }
}

module.exports = router
