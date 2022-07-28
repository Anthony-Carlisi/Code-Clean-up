const express = require('express')
const router = express.Router()
const sfHandler = require('../../hooks/sfHandler')
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')
const emailNotification = require('../../hooks/emailNotifications')
const config = require('config')

router.post('/', async (req, res) => {
  try {
    let leadInfo = req.body
    let {
      Submit_Date,
      Owner_Name,
      Company_Name,
      Phone,
      Email,
      State,
      Timezone,
      Income,
      Time_In_Business,
      Currently_Have_Open_Loan,
      Loan_Balance,
      Primary_Use_Of_Funds,
      Accept_Credit_Cards,
      Line_Type,
      Line_Status,
      Email_Status,
    } = leadInfo

    //Airtable duplicate checking
    const dupCheckPhoneMerchant = await dupBlockerCheck.dupCheck(
      [Phone],
      'Merchant Records',
      'phone'
    )

    const dupCheckEmailMerchant = await dupBlockerCheck.dupCheck(
      [Email],
      'Merchant Records',
      'email'
    )

    const dupCheckPhoneInbound = await dupBlockerCheck.dupCheck(
      [Phone],
      'Inbound Leads',
      'phone'
    )

    const dupCheckEmailInbound = await dupBlockerCheck.dupCheck(
      [Email],
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

    let fullName = Owner_Name.split(' ')
    let minIncome, maxIncome, minTIB, maxTIB

    let mobilePH = Line_Type == 'Phone Number' ? Phone : ''
    let phonePH = Line_Type != 'Phone Number' ? Phone : ''

    //Income Range
    let incomeMatches = Income.match(/[0-9]+,[0-9]+/g)
    if (incomeMatches.length == 2) {
      minIncome = incomeMatches[0].replace(',', '')
      maxIncome = incomeMatches[1].replace(',', '')
    } else if (incomeMatches.length == 1) {
      minIncome = incomeMatches[0].replace(',', '')
      maxIncome = incomeMatches[0].replace(',', '')
    }

    //Time in Business Range
    let tibMatches = Time_In_Business.match(/[0-9]+/g)
    if (tibMatches.length == 2) {
      minTIB = tibMatches[0]
      maxTIB = tibMatches[1]
    } else if (tibMatches.length == 1) {
      minTIB = tibMatches[0]
      maxTIB = tibMatches[0]
    }

    //find latest M80 RT campaign in SF
    let campaignQuery = await sfHandler.salesforceQuery(
      `SELECT name, id FROM Campaign WHERE ParentId='7018c0000026vLAAAY' AND IsActive=true ORDER BY CreatedDate DESC LIMIT 1`
    )

    //create lead body
    const leadBody = {
      FirstName: fullName[0],
      LastName: fullName[fullName.length - 1],
      company: Company_Name,
      email: Email,
      MobilePhone: mobilePH,
      phone: phonePH,
      state: State,
      Maximum_Monthly_Sales__c: maxIncome,
      Minimum_Monthly_Sales__c: minIncome,
      Maximum_Years_in_Business__c: maxTIB,
      Minimum_Years_in_Business__c: minTIB,
      Current_Balance__c: Loan_Balance.match(/[0-9,]+/g)[0].replace(',', ''),
      McaApp__Use_of_Proceeds__c: Primary_Use_Of_Funds,
      Accept_Credit_Cards__c: Accept_Credit_Cards,
      LeadSource: 'Real Time',
      Lead_Source_Detail__c: 'Pricing Calculator',
      CampaignID__c: campaignQuery.records[0].Id,
      Janati_RR__Round_Robin__c: 'Yes',
      Round_Robin_Assignment_Group__c: 'Pricing Calculator',
    }

    //add lead to SF
    let insertResult = await sfHandler.salesforceInsert('Lead', leadBody)

    //handle errors adding to SF
    if (insertResult instanceof Error) {
      if (insertResult.name == 'DUPLICATES_DETECTED') {
        await emailNotification.sendNotification(
          //send to marketing and accounting
          'marketing@straightlinesource.com, accounting@straightlinesource.com',
          'Enablement Duplicate Lead: Already in Salesforce',
          JSON.stringify(req.body, null, 2) +
            '\n\nDuplicate Rule: ' +
            insertResult.duplicateResut.duplicateRule
        )
      } else {
        await emailNotification.sendNotification(
          //send to marketing
          'marketing@straightlinesource.com',
          'Error adding Enablement Lead to Salesforce',
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
