const express = require('express')
const router = express.Router()
const sfHandler = require('../../hooks/sfHandler')

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

    let fullName = Owner_Name.split(' ')

    let minIncome, maxIncome, minTIB, maxTIB

    //Income Range
    let incomeMatches = Income.match(/[0-9]+,[0-9]+/g)
    if (incomeMatches.size() == 2) {
      minIncome = incomeMatches[0].replace(',', '')
      maxIncome = incomeMatches[1].replace(',', '')
    } else if (incomeMatches.size() == 1) {
      minIncome = incomeMatches[0].replace(',', '')
      maxIncome = incomeMatches[0].replace(',', '')
    }

    //Time in Business Range
    let tibMatches = Time_In_Business.match(/[0-9]+/g)
    if (tibMatches.size() == 2) {
      minTIB = tibMatches[0]
      maxTIB = tibMatches[1]
    } else if (tibMatches.size() == 1) {
      minTIB = tibMatches[0]
      maxTIB = tibMatches[0]
    }

    //create lead body
    const leadBody = {
      FirstName: fullName[0],
      LastName: fullName[fullName.size() - 1],
      company: Company_Name,
      email: Email,
      phone: Phone,
      state: State,
      Maximum_Monthly_Sales__c: maxIncome,
      Minimum_Monthly_Sales__c: minIncome,
      Maximum_Years_in_Business__c: maxTIB,
      Minimum_Years_in_Business__c: minTIB,
      LeadSource: 'Real Time',
      //Create these field values
      Lead_Source_Detail__c: 'Pricing Calculator',
      CampaignID__c: queryResult.records[0].Id,
      Janati_RR__Round_Robin__c: 'Yes',
      Round_Robin_Assignment_Group__c: 'Enablement',
    }

    //add lead to SF
    let insertResult = await sfHandler.salesforceInsert('Lead', leadBody)

    //handle errors adding to SF
    if (insertResult instanceof Error) {
      if (insertResult.name == 'DUPLICATES_DETECTED') {
        await emailNotification.sendNotification(
          //send to marketing and accounting
          //'marketing@straightlinesource.com, accounting@straightlinesource.com, vmangone@straightlinesource.com',
          'ehernandez@slsbiz.com',
          'Enablement Duplicate Lead: Already in Salesforce',
          JSON.stringify(req.body, null, 2) +
            '\n\nDuplicate Rule: ' +
            insertResult.duplicateResut.duplicateRule
        )
      } else {
        await emailNotification.sendNotification(
          //send to marketing
          //'marketing@straightlinesource.com',
          'ehernandez@slsbiz.com',
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
