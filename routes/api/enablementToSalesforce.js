const express = require('express')
const router = express.Router()
const sfHandler = require('../../hooks/sfHandler')

router.post('/', async (req, res)=>{
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

    let minIncome, maxIncome, minTIB, maxTIB
    let incomeMatches = Income.match(/[0-9]+,[0-9]+/g)

    //if(incomeMatches.)


})


module.exports = router