const express = require('express')
const jsforce = require('jsforce')
const config = require('config')
const router = express.Router()
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')
const sfHelper = require('../../hooks/ehez_sfHelper')

// @route   Post api/popCrumbs
// @desc    test
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      First_Name: firstName,
      Last_Name: lastName,
      Business_Name: companyName,
      Email: email,
      Primary_Phone: phone,
      Secondary_Phone: secondaryPhone,
      Alternate_Phone_1: altPhone1,
      Alternate_Phone_2: altPhone2,
      Address: address,
      City: city,
      State: state,
      Zip: zip,
    } = req.body

    // console.log(req.body)

    const leadBody = {
      FirstName: firstName,
      LastName: lastName,
      company: companyName,
      email: email,
      phone: phone,
      MobilePhone: secondaryPhone,
      street: address,
      city: city,
      state: state,
      PostalCode: zip,
      LeadSource: 'Real Time',
      ricoMarketingMethod__c: 'Dialer'
      // CampaignID__c:
    }

    await sfHelper.salesforceInsert("Lead", leadBody)
    // console.log(result)
    res.sendStatus(200)
    return

    // Combine all the phone numbers into an array
    const arr = [phone, secondaryPhone, altPhone1, altPhone2]

    // Remove any empty phone numbers within the array
    const phoneArray = arr.filter((element) => {
      return element !== ''
    })

    //Dup Blocking checking
    const dupCheckPhoneMerchant = await dupBlockerCheck.dupCheck(
      phoneArray,
      'Merchant Records',
      'phone'
    )
    if (dupCheckPhoneMerchant?.length > 0)
      return res.send(`This Lead is a Dup Block`)

    const dupCheckPhoneInbound = await dupBlockerCheck.dupCheck(
      phoneArray,
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

    // New Object created for inbound leads
    // const newLeadObj = {
    //   ['Merchant First Name']: firstName,
    //   ['Merchant Last Name']: lastName,
    //   ['Company Name']: companyName,
    //   Email: email,
    //   ['Business Phone']: phone,
    //   ['Mobile Phone']: secondaryPhone,
    //   ['Business Address']: address,
    //   ['Business City']: city,
    //   ['Business State']: state,
    //   ['Business Zip']: zip,
    //   ['Tag (Vendor)']: ['rectqM9B1Gx7zU6v7'],
    //   ['Lead Type (Vehicle)']: ['recxxRZlDEadnzlYj'],
    //   ['Lead Source (iMerchant Lead Source)']: ['recwQSCQPPhdfB8kJ'],
    //   ['Agent Status']: 'New Lead',
    // }

    

    // // Create New Lead
    // await airtableHelper.airtableCreate('Inbound Leads', newLeadObj)

    //Return ok
    res.sendStatus(200)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
