// add route to from rico to SF
const jsforce = require('jsforce')
const express = require('express')
const router = express.Router()
const config = require('config')
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')

const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com',
})

conn.login(
  config.get('salesforceEmail'),
  config.get('salesforcePassword') + config.get('salesforceToken'),
  (err, userInfo) => {
    if (err) {
      console.log(err)
    }
  }
)

router.get('/', async (req, res) => {
  try {
    // Deconstruct object from Ricochet
    let {
      //add channel (inbound, outbound), campaign (the actual list or campaign running)
      companyName,
      assigneeEmail, //lead owner email
      uploadDate, //need to add this to SF
      phone,
      address,
      city,
      state,
      zip,
      leadSource, //Referral or the base of the leads (UCC (or Cold), Hot, Facebook etc…)
      vendor, //Business we bought lead from
      firstName,
      lastName,
      email,
      campaignId,
    } = req.query

    // console.log(req.query)

    //full name might be in first name field so split it and distribute
    let names = firstName.split(' ')
    let nameOutput
    if (names.length == 1) {
      let lName
      if (lastName.length > 0) lName = lastName
      else lName = 'Update Last Name'
      nameOutput = { first: names[0], middle: '', last: lName }
    }

    if (names.length == 2) {
      nameOutput = { first: names[0], middle: '', last: names[1] }
    }

    if (names.length >= 3) {
      nameOutput = { first: names[0], middle: names[1], last: names[2] }
    }

    //state might be spelled out (must be 2 letters or empty)
    if (state.length != 2) state = ''

    //search for agents userID
    let userID = ''
    await conn.query(
      `SELECT email, id FROM User WHERE email = '${assigneeEmail}'`,
      (err, result) => {
        if (err) {
          res.send(err)
        } else {
          console.log('Total user records: ' + result.totalSize)
          userID = result.records[0].Id
        }
      }
    )
    //Dup Blocking checking
    const dupCheckPhoneMerchant = await dupBlockerCheck.dupCheck(
      [phone],
      'Merchant Records',
      'phone'
    )
    if (dupCheckPhoneMerchant?.length > 0)
      return res.send(`This Lead is a Dup Block`)

    const dupCheckPhoneInbound = await dupBlockerCheck.dupCheck(
      [phone],
      'Inbound Leads',
      'phone'
    )
    if (dupCheckPhoneInbound?.length > 0)
      return res.send(`This Lead is a Dup Block`)

    const dupCheckEmailMerchant = await dupBlockerCheck.dupCheck(
      [email],
      'Merchant Records',
      'email'
    )
    if (dupCheckEmailMerchant?.length > 0)
      return res.send(`This Lead is a Dup Block`)

    const dupCheckEmailInbound = await dupBlockerCheck.dupCheck(
      [email],
      'Inbound Leads',
      'email'
    )
    if (dupCheckEmailInbound?.length > 0)
      return res.send(`This Lead is a Dup Block`)

    //create lead object
    await conn.sobject('Lead').create(
      {
        FirstName: nameOutput.first,
        MiddleName: nameOutput.middle,
        LastName: nameOutput.last,
        MobilePhone: phone.slice(1),
        company: companyName,
        OwnerId: userID,
        street: address,
        city: city,
        state: state,
        PostalCode: zip.substring(0, 5),
        email: email,
        CampaignID__c: campaignId,
        ricoLeadSource__c: leadSource,
        ricoVendor__c: vendor,
        LeadSource: 'Ricochet',
        Lead_Type__c: 'Outbound',
        ricoUploadDate__c: Date.parse(uploadDate),
      },
      function (err, ret) {
        if (err || !ret.success) {
          return console.error(err, ret)
        }
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
    // console.log(error)
  }
})

module.exports = router
