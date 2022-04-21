const express = require('express')
const router = express.Router()
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')
const airtableHelper = require('../../hooks/airtableHelper.js')
const { google } = require('googleapis')
const crypto = require('crypto')
const moment = require('moment')
const emailNotification = require('../../hooks/emailNotifications')

// Utility Functions

// Initiates the Google Auth
const auth = new google.auth.GoogleAuth({
  keyFile: 'config/keys.json', //the key file
  //url to spreadsheets API
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
})

// Turns Google Sheets API Batch Data into an Object
const tableObj = (data) => {
  var batchRowValues = data['valueRanges'][0]['values']
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

// @route   Post api/linkTracker
// @desc    Create unique IDs for tracking per lead
// @access  Public
router.post('/', async (req, res) => {
  try {
    // Deconstruct object from Google Apps Script Post
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

    //Dup Blocking checking
    const dupCheckPhoneMerchant = await dupBlockerCheck.dupCheck(
      [phone],
      'Merchant Records',
      'phone'
    )
    if (dupCheckPhoneMerchant?.length > 0)
      return res.send(`This Lead is a Dup Block`)

    const dupCheckPhoneInbound = await dupBlockerCheck.dupCheck(
      [phone],
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
    for (i = 0; i < prevEmails.length; i++) {
      if (prevEmails[i][0] === email)
        return res.send(`This Lead is a Dup Block`)
    }

    // Next Row
    const newRowNum = readData.data.values.length + 1

    // Creates unique IDs per lead
    const linkId = crypto.randomUUID({ disableEntropyCache: true })

    // Link to track
    const link = `https://api.straightlinesource.com/api/link/t/${linkId}`

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
    // URL Param for ID REQUIRED
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

    // Turning the data into a readable obj
    const dataObj = tableObj(readData.data)

    // Declaring the variables for obj and row to update
    let idRowIndex = 0
    let objToUpdate

    // Loop to figure out which Row and Obj triggered the request
    for (i = 0; i < dataObj.length; i++) {
      if (dataObj[i].Id === trackerId) {
        idRowIndex = i + 2
        objToUpdate = dataObj[i]
      }
    }

    // Incrementing the opens for the lead
    const triggerIncrement = Number(objToUpdate['Link Triggers']) + 1

    // Updates the original lead with the new incremented value
    await googleSheetsInstance.spreadsheets.values.update({
      auth, //auth object
      spreadsheetId, // spreadsheet id
      range: `Leads!J${idRowIndex}`, //range of cells to read from.
      valueInputOption: 'USER_ENTERED',
      resource: {
        majorDimension: 'ROWS',
        values: [[triggerIncrement]],
      },
    })

    // Reading from a spreadsheet
    const nextRowData = await googleSheetsInstance.spreadsheets.values.get({
      auth, //auth object
      spreadsheetId, // spreadsheet id
      range: 'Link Opens!A:A', //range of cells to read from.
    })

    // Next Row
    const newRowNum = nextRowData.data.values.length + 1

    // Write data into the google sheets
    await googleSheetsInstance.spreadsheets.values.append({
      auth, //auth object
      spreadsheetId, //spreadsheet id
      range: `Link Opens!A${newRowNum}:I${newRowNum}`, //sheet name and range of cells
      valueInputOption: 'USER_ENTERED', // The information will be passed according to what the user passes in as date, number or text
      resource: {
        values: [
          [
            moment().format('MM-DD-YYYY HH:mm'),
            objToUpdate.Id,
            objToUpdate.Name,
            objToUpdate.Phone,
            objToUpdate.Email,
            objToUpdate.Company,
            objToUpdate.State,
            objToUpdate.Source,
            objToUpdate['Lead Source'],
          ],
        ],
      },
    })

    //Dup Blocking
    const dupRecordCheck = await airtableHelper.airtableSearch(
      'Merchant Records',
      `OR({Business Phone Text} = ${objToUpdate.Phone}, {Owner 1 Mobile Text} = ${objToUpdate.Phone})`,
      'Scrubbing Tool'
    )
    if (dupRecordCheck?.length > 0) return res.send(`This Lead is a Dup Block`)

    //inbound lead check
    const inboundLeadCheck = await airtableHelper.airtableSearch(
      'Inbound Leads',
      `OR({Mobile Phone Formatted} = ${objToUpdate.Phone}, {Business Phone Formatted} = ${objToUpdate.Phone})`,
      'Scrubbing Tool'
    )

    if (inboundLeadCheck?.length > 0) {
      // Deconstruct lead to update
      const {
        'Lead Type (Vehicle)': leadType,
        'Merchant Name': merchantName,
        Email: email,
        'Mobile Phone': mobilePhone,
        'Business Phone': businessPhone,
        'Agent Email': agentEmails,
      } = inboundLeadCheck[0].fields

      const leadTypeInfo = await airtableHelper.airtableSearch(
        'Marketing Data',
        `{recordId} = '${leadType}'`,
        'Grid view'
      )

      const leadTypeName = leadTypeInfo[0].fields['Marketing Method']

      //Promises created to create the emails to send out
      const newLinkClickEmail = agentEmails.map(async (agentEmail) => {
        const emailAgent = await emailNotification.sendNotification(
          `${agentEmail}`,
          `Your lead has clicked your link again ${leadTypeName} ${merchantName} ${email} ${mobilePhone}`,
          `
          You have an Updated ${leadTypeName} in your Stacker 'Hot Leads' table.
          Merchant Name: ${merchantName}
          Merchant Mobile: ${mobilePhone}
          Business Phone: ${businessPhone}
          Merchant Email: ${email}
          `
        )
        if (emailAgent) return emailAgent
      })

      //Sends emails to all reciptiants
      await Promise.all(newLinkClickEmail)
    } else {
      // Search for Lead Source
      const leadSourceInfo = await airtableHelper.airtableSearch(
        'Lead Source',
        `{Lead Source} = '${objToUpdate['Lead Source']}'`,
        'Grid view'
      )

      // Get Lead Source ID
      const leadSourceId = leadSourceInfo[0].id

      // const vendorInfo = await airtableHelper.airtableSearch(
      //   'Vendor List',
      //   `{Vendor} = '${vendor}'`,
      //   'Grid view'
      // )

      // const vendorId = vendorInfo[0].id

      // //  Create Object to send to Airtable
      const airtableLead = {
        Email: objToUpdate.Email,
        'Merchant First Name': objToUpdate.Name,
        'Mobile Phone': objToUpdate.Phone,
        'Company Name': objToUpdate.Company,
        'Agent Status': 'New Lead',
        'Processing Status': 'New Lead',
        // 'Tag (Vendor)': [vendorId],
        'Lead Source (iMerchant Lead Source)': [leadSourceId],

        // Hard encoded Clicks Marketing Data
        'Lead Type (Vehicle)': ['reca3n32RNvnWqp7a'],
        // campaignID: campaignId,
      }

      await airtableHelper.airtableCreate('Inbound Leads', airtableLead)
    }

    // Redirect when Completed
    res.redirect('https://straightlinesource.com/thankyou/')
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
