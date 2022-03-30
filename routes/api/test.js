const express = require('express')
const router = express.Router()
const dupBlockerCheck = require('../../hooks/dupBlockerCheck')
const airtableHelper = require('../../hooks/airtableHelper.js')

// @route   Post api/test
// @desc    test
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Deconstruct object from Ricochet
    let {
      companyName,
      assignee,
      uploadDate,
      phone,
      address,
      city,
      state,
      zip,
      leadSource,
      firstName,
      lastName,
      email,
    } = req.query

    //Dup Blocking
    const dupCheck = await dupBlockerCheck([phone])
    if (dupCheck?.length > 0) return res.send(`This Lead is a Dup Block`)

    // Find Assignee in Agent Table off Ricochet Assignee
    const findAssignees = await airtableHelper.airtableSearch(
      'Agent Table',
      `{Email} = '${assignee}'`,
      'Grid view'
    )

    // Change Assignee to Name instead of email
    assignee = [findAssignees[0].fields.Name]

    // Combine all Assignees necessary
    if (findAssignees[0].fields.hasOwnProperty('Chaser'))
      assignee = assignee.concat(findAssignees[0].fields.Chaser)
    if (findAssignees[0].fields.hasOwnProperty('Senior')) {
      assignee = assignee.concat(findAssignees[0].fields.Senior)
    }

    // Loop through each assignee and get there IDs
    const assigneesIdsPromises = assignee.map(async (assignee) => {
      const findAssignee = await airtableHelper.airtableSearch(
        'Agent Table',
        `{Name} = '${assignee}'`,
        'Grid view'
      )
      return findAssignee[0].id
    })

    assignee = await Promise.all(assigneesIdsPromises)

    // Find Lead Source Id based off lead Source Name
    const leadSourceSearch = await airtableHelper.airtableSearch(
      'Lead Source',
      `{Lead Source} = '${leadSource}'`,
      'Grid view'
    )

    // Assign Lead Source Id to leadSource
    if (leadSourceSearch?.length > 0) {
      leadSource = [leadSourceSearch[0].id]
    } else {
      // if no lead source found default to Undefined
      leadSource = ['recD8X2Wc4ey8SVZT']
    }

    //  Create Object to send to Airtable
    const airtableLead = {
      'Legal Name': companyName,
      // Passing Assignee ID
      Assignees: assignee,
      'Primary Assignee': [assignee[0]],
      'Upload Date': uploadDate,
      'Business Phone': phone.toString(),
      'Business Address': address,
      'Business Zip': zip,
      'Business City': city,
      'Business State': state,
      'Lead Source': leadSource,
      // ID for Dialer
      'Marketing Method': ['rec8xeFAHTpPr6tYs'],
      'Merchant 1 Full Name': `${firstName} ${lastName}`,
      'Email 1': email,
    }

    // Checks to see if lead exists prior to creating a new lead
    const updateRecordCheck = await airtableHelper.airtableSearch(
      'Merchant Records',
      `OR({Business Phone Text} = ${phone}, {Owner 1 Mobile Text} = ${phone})`,
      'Grid view'
    )

    // If records is found to bed updated
    if (updateRecordCheck?.length > 0) {
      //console.log(updateRecordCheck[0].fields)
      const updatedLead = await airtableHelper.airtableUpdate(
        'Merchant Records',
        updateRecordCheck[0].id,
        airtableLead
      )
      return res.send(`Lead Updated! MID is ${updatedLead[0].fields.MID}`)
    }

    airtableHelper.airtableCreate('Merchant Records', airtableLead)

    res.send(`New Lead Created`)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
