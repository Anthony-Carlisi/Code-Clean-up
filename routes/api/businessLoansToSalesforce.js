const express = require('express')
const router = express.Router()
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')
const sfHandler = require('../../hooks/sfHandler')
const emailNotification = require('../../hooks/emailNotifications')

router.post('/', async (req, res)=>{
    let leadInfo = req.body.docs[0].lead
    let campaignId = req.body.docs[0].campaignId
    
    let {
        company: company,
        industry: industry,
        annual_revenue: annualRev   //We have been doing monthly revenue range. Are we still doing range? Do you want to divide by 12?
    } = leadInfo

    let {
        month: month,   //need to convert month and year to Date field
        year: year
    } = leadInfo.founded

    let {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone    //10 digit number?
    } = leadInfo.contact

    let {
        city: city,
        state: state,   //is this a 2 letter State Code?
        zip: zip    //5 digit zip?
    } = leadInfo.address

    let {
        reason: reason, 
        amount: amount  //amount requested
    } = leadInfo.loan

    console.log(campaignId + '\n' + company + '\n'+ year + '\n' + firstName + '\n' + zip + '\n' + amount + '\n' + phone.replace(/[^0-9]/g, '').slice(-10))

    res.send('This is in businessLoansToSalesforce.js')
})

module.exports = router