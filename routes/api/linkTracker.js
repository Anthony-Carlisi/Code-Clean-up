const express = require('express')
const router = express.Router()
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')
const airtableHelper = require('../../hooks/airtableHelper.js')
const { google } = require('googleapis')
const crypto = require('crypto')

const auth = new google.auth.GoogleAuth({
  keyFile: 'config/keys.json', //the key file
  //url to spreadsheets API
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
})

// @route   Post api/linkTracker
// @desc    Create unique IDs for tracking per lead
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

    //Dup Blocking
    const dupCheck = await dupBlockerCheck([phone])
    if (dupCheck?.length > 0) return res.send(`This Lead is a Dup Block`)

    // Auth with Google API
    const authClientObject = await auth.getClient()
    // Declare the API
    const googleSheetsInstance = google.sheets({
      version: 'v4',
      auth: authClientObject,
    })
    // What spreadsheet to edit
    const spreadsheetId = '1tVc8cYS_724wem4gr5bcDuNCTSRQXfAwa-6YsyStfvA'

    // Reading from a spreadsheet
    const readData = await googleSheetsInstance.spreadsheets.values.get({
      auth, //auth object
      spreadsheetId, // spreadsheet id
      range: 'Leads!D:D', //range of cells to read from.
    })

    // Array of all Emails within column
    const prevEmails = readData.data.values

    // Checking to see if email already exists within the list
    let check = 0
    prevEmails.map((prevEmail) => {
      if (prevEmail[0] === email) check = check + 1
    })
    if (check > 0) return res.send(`This Lead is a Dup Block`)

    // Next Row
    const newRowNum = readData.data.values.length + 1

    // Creates unique IDs per lead
    const linkId = crypto.randomUUID({ disableEntropyCache: true })
    // console.log(linkId)
    // Link to track
    const link = `https://api.straightlinesource.com/api/linkTracker/t/${linkId}`

    // Write data into the google sheets
    await googleSheetsInstance.spreadsheets.values.append({
      auth, //auth object
      spreadsheetId, //spreadsheet id
      range: `Leads!A${newRowNum}:I${newRowNum}`, //sheet name and range of cells
      valueInputOption: 'USER_ENTERED', // The information will be passed according to what the user passes in as date, number or text
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
            0,
            linkId,
            link,
          ],
        ],
      },
    })

    res.send(`New Lead Created`)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

router.get('/t/:id', async (req, res) => {
  try {
    console.log(req.params.id)
    const trackerId = req.params.id

    // Auth with Google API
    const authClientObject = await auth.getClient()
    // Declare the API
    const googleSheetsInstance = google.sheets({
      version: 'v4',
      auth: authClientObject,
    })
    // What spreadsheet to edit
    const spreadsheetId = '1tVc8cYS_724wem4gr5bcDuNCTSRQXfAwa-6YsyStfvA'

    // Reading from a spreadsheet
    const readData = await googleSheetsInstance.spreadsheets.values.batchGet({
      auth, //auth object
      spreadsheetId, // spreadsheet id
      ranges: ['Leads!A:K'], //range of cells to read from.
    })

    const tableObj = () => {
      var batchRowValues = readData.data['valueRanges'][0]['values']
      var rows = []
      for (var i = 1; i < batchRowValues.length; i++) {
        var rowObject = {}
        for (var j = 0; j < batchRowValues[i].length; j++) {
          rowObject[batchRowValues[0][j]] = batchRowValues[i][j]
        }
        rows.push(rowObject)
      }
      return rows
    }

    console.log(tableObj())

    res.redirect('https://straightlinesource.com/')
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
