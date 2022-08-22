const express = require('express')
const jsforce = require('jsforce')
const config = require('config')
const router = express.Router()
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')
const sfHandler = require('../../hooks/sfHandler')
const emailNotification = require('../../hooks/emailNotifications')

// @route   Post api/popCrumbs
// @desc    endpoint for popcrumbs/M80 RT
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
      Business_Website: website,
      Requested_Loan_Amount: requestedAmount,
      Monthly_Gross_Sales: monthlySales,
      Time_In_Business: yearsInBusiness,
      IP_Address: IP
    } = req.body
    // console.log(req.body)

    // Combine all the phone numbers into an array
    const arr = [phone, secondaryPhone, altPhone1, altPhone2]

    // Remove any empty phone numbers within the array
    const phoneArray = arr.filter((element) => {
      return element !== ''
    })

    //Airtable duplicate checking
    const dupCheckPhoneMerchant = await dupBlockerCheck.dupCheck(
      phoneArray,
      'Merchant Records',
      'phone'
    )

    const dupCheckPhoneInbound = await dupBlockerCheck.dupCheck(
      phoneArray,
      'Inbound Leads',
      'phone'
    )

    const dupCheckEmailMerchant = await dupBlockerCheck.dupCheck(
      [email],
      'Merchant Records',
      'email'
    )

    const dupCheckEmailInbound = await dupBlockerCheck.dupCheck(
      [email],
      'Inbound Leads',
      'email'
    )

    if (
      dupCheckPhoneMerchant?.length > 0 ||
      dupCheckPhoneInbound?.length > 0 ||
      dupCheckEmailMerchant?.length > 0 ||
      dupCheckEmailInbound?.length > 0
    ){
      await emailNotification.sendNotification( //send to marketing and accounting
        'marketing@straightlinesource.com, business@straightlinesource.com',
        'M80 RT Duplicate Lead: Already in Stacker',
        JSON.stringify(req.body, null, 2)
      )

      return res.send(`This Lead is a Dup Block`)
    }

    //find ranges
    let minRequested,
      maxRequested,
      minMonthlySales,
      maxMonthlySales,
      minYears,
      maxYears

    let requestedRange = requestedAmount.match(/[,0-9]+/g)
    if (requestedRange.length == 2) {
      minRequested = requestedRange[0]
      maxRequested = requestedRange[1]
    } else if (requestedRange.length == 1) {
      minRequested = requestedRange[0]
      maxRequested = requestedRange[0]
    }

    let monthlySalesRange = monthlySales.match(/[,0-9]+/g)
    if (monthlySalesRange.length == 2) {
      minMonthlySales = monthlySalesRange[0]
      maxMonthlySales = monthlySalesRange[1]
    } else if (monthlySalesRange.length == 1) {
      minMonthlySales = monthlySalesRange[0]
      maxMonthlySales = monthlySalesRange[0]
    }

    switch (yearsInBusiness) {
      case '6-12 Months':
        minYears = 0.5
        maxYears = 1
        break
      case 'Under 6 Months':
        minYears = 0
        maxYears = 0.5
        break
      case '1-2 Years':
        minYears = 1
        maxYears = 2
        break
      case '2-4 Years':
        minYears = 2
        maxYears = 4
        break
      case 'Over 4 Years':
        minYears = 4
        maxYears = 4
        break
      default:
        minYears = 0
        maxYears = 0
    }

    //find latest M80 RT campaign in SF
    let queryResult = await sfHandler.salesforceQuery(
      `SELECT name, id FROM Campaign WHERE ParentId='7018c0000026cQbAAI' ORDER BY CreatedDate DESC LIMIT 1`
    )

    //create lead body
    const leadBody = {
      OwnerID: '00G8c000006CjhBEAS', //For Distribution Queue
      FirstName: firstName,
      LastName: lastName,
      company: companyName,
      email: email,
      phone: secondaryPhone,
      MobilePhone: phone,
      Website: website,
      street: address,
      city: city,
      state: state,
      PostalCode: zip,
      Maximum_Amount_Requested__c: maxRequested.replace(',', ''),
      Minimum_Amount_Requested__c: minRequested.replace(',', ''),
      Maximum_Monthly_Sales__c: maxMonthlySales.replace(',', ''),
      Minimum_Monthly_Sales__c: minMonthlySales.replace(',', ''),
      Maximum_Years_in_Business__c: maxYears,
      Minimum_Years_in_Business__c: minYears,
      LeadSource: 'Real Time',
      Lead_Source_Detail__c: 'US Business Funding',
      Lead_Type__c: 'Inbound',
      CampaignID__c: queryResult.records[0].Id,
      Janati_RR__Round_Robin__c: 'Yes',
      Round_Robin_Assignment_Group__c: 'Real Time',
      IP_Address__c: IP
    }

    //add lead to SF
    let insertResult = await sfHandler.salesforceInsert('Lead', leadBody)

    //handle errors adding to SF
    if (insertResult instanceof Error) {
      if (insertResult.name == 'DUPLICATES_DETECTED') {
        await emailNotification.sendNotification(
          //send to marketing and accounting
          'marketing@straightlinesource.com, accounting@straightlinesource.com, vmangone@straightlinesource.com',
          'M80 RT Duplicate Lead: Already in Salesforce',
          JSON.stringify(req.body, null, 2) +
            '\n\nDuplicate Rule: ' +
            insertResult.duplicateResut.duplicateRule
        )
      } else {
        await emailNotification.sendNotification(
          //send to marketing
          'marketing@straightlinesource.com',
          'Error adding M80 RT Lead to Salesforce',
          insertResult.name +
            ': ' +
            insertResult.message +
            '\n' +
            JSON.stringify(req.body, null, 2)
        )
      }
    }

    //Return ok
    res.sendStatus(200)
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

module.exports = router
