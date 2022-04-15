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
      phone,
      email,
      company,
      state,
      source,
      purchaseDate,
      leadSource,
    } = req.body
    phone = phone.replace(/-/g, '')

    const authClientObject = await auth.getClient()

    const googleSheetsInstance = google.sheets({
      version: 'v4',
      auth: authClientObject,
    })

    const spreadsheetId = '1tVc8cYS_724wem4gr5bcDuNCTSRQXfAwa-6YsyStfvA'

    const readData = await googleSheetsInstance.spreadsheets.values.get({
      auth, //auth object
      spreadsheetId, // spreadsheet id
      range: 'Leads!D:D', //range of cells to read from.
    })

    const prevEmails = readData.data.values

    let check = 0
    prevEmails.map((prevEmail) => {
      if (prevEmail[0] === email) check = check + 1
    })
    if (check > 0) return res.send(`This Lead is a Dup Block`)

    // Next Row
    const newRowNum = readData.data.values.length + 1

    const linkId = crypto.randomUUID()

    const link = `https://api.straightlinesource.com/t/${linkId}`
    //write data into the google sheets
    await googleSheetsInstance.spreadsheets.values.append({
      auth, //auth object
      spreadsheetId, //spreadsheet id
      range: `Leads!A${newRowNum}:I${newRowNum}`, //sheet name and range of cells
      valueInputOption: 'USER_ENTERED', // The information will be passed according to what the usere passes in as date, number or text
      resource: {
        values: [
          [
            date,
            name,
            phone,
            email,
            company,
            state,
            source,
            purchaseDate,
            leadSource,
            linkId,
            link,
          ],
        ],
      },
    })

    //Dup Blocking
    const dupCheck = await dupBlockerCheck([phone])
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
