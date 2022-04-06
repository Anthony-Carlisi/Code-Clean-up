// add route to from rico to SF
const jsforce = require('jsforce')
const express = require('express')
const router = express.Router()
const config = require('config')
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')

const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com',
})

// initConnect = async () => {
//     var conn = new jsforce.Connection({
//       loginUrl: 'https://login.salesforce.com'
//     });
//     await conn.login(USER_ID, PASSWORD + SEC_TOKEN, (err, userInfo) => {
//         if (err)
//           console.log(err);
//         else {
//           console.log(userInfo.Id);
//         }

//       });
//   }

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
    } = req.query

    console.log(req.query)

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

    let dupATCheck = await dupBlockerCheck([phone])
    if (dupATCheck?.length > 0)
      return res.send(`This Lead is a Dup Block in Stacker`)

    //create lead object
    await conn.sobject('Lead').create(
      {
        FirstName: nameOutput.first,
        MiddleName: nameOutput.middle,
        LastName: nameOutput.last,
        phone: phone,
        company: companyName,
        OwnerId: userID,
        street: address,
        city: city,
        state: state,
        PostalCode: zip.substring(0, 5),
        email: email,
        CampaignID__c: '7018c000000xC4PAAU',
        ricoLeadSource__c: leadSource,
        ricoVendor__c: vendor,
        LeadSource: 'Ricochet',
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
