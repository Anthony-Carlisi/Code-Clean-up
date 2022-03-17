const express = require('express')
const router = express.Router()
const Airtable = require('airtable')
const config = require('config')

const base = new Airtable({ apiKey: config.get('airtableApiKey') }).base(
  config.get('airtableBase')
)

const airtableSearch = async (table, filterFormula, scrubbingView) => {
  try {
    const records = await base(table)
      .select({
        //Change filter params
        filterByFormula: filterFormula,
        view: scrubbingView,
      })
      .all()
    return records
  } catch (error) {
    console.log(error)
  }
}

const airtableUpdate = async (table, recordId, data) => {
  try {
    const recordUpdate = await base(table).update([
      {
        id: recordId,
        fields: data,
      },
    ])
    return recordUpdate
  } catch (error) {
    console.log(error)
  }
}

const airtableCreate = async (table, data) => {
  try {
    const newRecord = await base(table).create([
      {
        fields: data,
      },
    ])
    return newRecord
  } catch (error) {
    console.log(error)
  }
}

// @route   Post api/upload
// @desc    Create a lead within Airtable
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

    // Remove 1 from the beginning of the phone number
    phone = phone.slice(1)
    //phone = 6159276039

    // Merchant Records Scrubbing tool table check using Phone Number
    const dupRecordCheck = await airtableSearch(
      'Merchant Records',
      `OR({Business Phone Text} = ${phone}, {Owner 1 Mobile Text} = ${phone})`,
      'Scrubbing Tool'
    )

    // If records is found
    if (dupRecordCheck?.length > 0) {
      return res.send(`This Lead is a Dup Block`)
    }

    // Inbound Leads Scrubbing tool table check using Phone Number
    const dupRecordCheckInbound = await airtableSearch(
      'Inbound Leads',
      `OR({Mobile Phone Formatted} = ${phone}, {Business Phone Formatted} = ${phone})`,
      'Scrubbing Tool'
    )

    // If records is found
    if (dupRecordCheckInbound?.length > 0) {
      return res.send(`This Lead is a Dup Block`)
    }

    // Find Assignee in Agent Table off Ricochet Assignee
    const findAssignees = await airtableSearch(
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

    // Create an array to be used for Assignee
    let assigneeArray = []

    // Loop through each assignee and get there IDs
    for (let index = 0; index < assignee.length; index++) {
      const findAssignee = await airtableSearch(
        'Agent Table',
        `{Name} = '${assignee[index]}'`,
        'Grid view'
      )
      assigneeArray.push(findAssignee[0].id)
    }

    // Find Lead Source Id based off lead Source Name
    const leadSourceSearch = await airtableSearch(
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
      Assignees: assigneeArray,
      'Primary Assignee': [findAssignees[0].id],
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
    const updateRecordCheck = await airtableSearch(
      'Merchant Records',
      `OR({Business Phone Text} = ${phone}, {Owner 1 Mobile Text} = ${phone})`,
      'Grid view'
    )

    // If records is found to bed updated
    if (updateRecordCheck?.length > 0) {
      //console.log(updateRecordCheck[0].fields)
      const updatedLead = await airtableUpdate(
        'Merchant Records',
        updateRecordCheck[0].id,
        airtableLead
      )
      return res.send(`Lead Updated! MID is ${updatedLead[0].fields.MID}`)
    }

    airtableCreate('Merchant Records', airtableLead)

    res.send(`New Lead Created`)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
