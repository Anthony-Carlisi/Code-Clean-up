const express = require('express')
const router = express.Router()
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')
const airtableHelper = require('../../hooks/airtableHelper.js')

// @route   Post api/test
// @desc    test
// @access  Public
router.post('/', async (req, res) => {
  try {
    // Deconstruct object from Ricochet
    let {
      date,
      name,
      mobilePhone,
      businessName,
      fico,
      amountRequested,
      annualSales,
      businessType,
      pageName,
      url,
      variant,
      ip,
      id,
    } = req.body

    console.log(mobilePhone)

    // //Dup Blocking
    // const dupCheck = await dupBlockerCheck([mobilePhone])
    // if (dupCheck?.length > 0) {
    //   console.log(dupCheck[0][0]._table.name)
    //   return res.send(`This Lead is a Dup Block`)
    // }

    res.send(`New Lead Created`)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
