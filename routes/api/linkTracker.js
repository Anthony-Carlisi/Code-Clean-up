const express = require('express')
const router = express.Router()
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')
const airtableHelper = require('../../hooks/airtableHelper.js')
const { google } = require('googleapis')
const crypto = require('crypto')

const auth = new google.auth.GoogleAuth({
  keyFile: 'keys.json', //the key file
  //url to spreadsheets API
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
})

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
    mobilePhone = mobilePhone.replace(/-/g, '')

    const authClientObject = await auth.getClient()

    const googleSheetsInstance = google.sheets({
      version: 'v4',
      auth: authClientObject,
    })

    const spreadsheetId = '1tVc8cYS_724wem4gr5bcDuNCTSRQXfAwa-6YsyStfvA'

    const readData = await googleSheetsInstance.spreadsheets.values.get({
      auth, //auth object
      spreadsheetId, // spreadsheet id
      range: 'Link Opens!A:A', //range of cells to read from.
    })

    //send the data reae with the response
    console.log(readData.data)
    // Next Row
    const newRowNum = readData.data.values.length + 1

    //write data into the google sheets
    await googleSheetsInstance.spreadsheets.values.append({
      auth, //auth object
      spreadsheetId, //spreadsheet id
      range: `Link Opens!A${newRowNum}:K${newRowNum}`, //sheet name and range of cells
      valueInputOption: 'USER_ENTERED', // The information will be passed according to what the usere passes in as date, number or text
      resource: {
        values: [
          [
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
          ],
        ],
      },
    })

    console.log(crypto.randomUUID())

    //Dup Blocking
    const dupCheck = await dupBlockerCheck([mobilePhone])
    if (dupCheck?.length > 0) {
      console.log(dupCheck[0][0]._table.name)
      return res.send(`This Lead is a Dup Block`)
    }

    res.send(`New Lead Created`)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
