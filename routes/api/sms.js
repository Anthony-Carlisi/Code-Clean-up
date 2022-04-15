const express = require('express')
const router = express.Router()
const airtableHelper = require('../../hooks/airtableHelper.js')
const emailNotification = require('../../hooks/emailNotifications')

const Filter = require('bad-words')
const filter = new Filter()

filter.addWords(
  'not interested',
  'get lost',
  "don't own a business",
  'all good',
  'go away',
  "I'm good",
  'not needed',
  'retired',
  'i do not recognize this number',
  'all set',
  'leave me alone',
  'no thanks',
  'die',
  'do not contact',
  'spam',
  'no thank you',
  "don't have good credit",
  'not in the market',
  'get me off your list',
  'never contact me',
  "don't need financing",
  'not looking',
  'do not call',
  'stop',
  'no interest',
  "don't text ever again",
  'remove',
  'stop messaging',
  'this is not a business',
  'stop texting',
  'quit texting',
  'take me off your list',
  'delete',
  'DND',
  'DNC',
  'the number you are sending an SMS to',
  'wrong person',
  "sorry, can't talk right now",
  'this phone number is no longer in service',
  'never showed interest',
  'opt out ',
  'wrong number',
  'we never spoke',
  "Don't Bother"
)

// @route   Post api/test
// @desc    test
// @access  Public
router.post('/origination', async (req, res) => {
  try {
    // Deconstruct object from Ricochet

    let {
      'Lead Source': leadSource,
      Vendor: vendor,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email,
      phone,
      tags,
      company_name: companyName,
      message: { type: messageType },
      message: { body: messageBody },
      address1: address,
      state,
      city,
      location: { name: locationName },
      'Campaign ID': campaignId,
    } = req.body
    // Remove first two characters from phone +1

    if (filter.isProfane(messageBody)) return res.send(`Profane language`)

    const leadTypeId =
      locationName === 'We Process'
        ? ['recYN3IouIGLcYnNm']
        : ['recxpVfCHIqJCFTtG']
    phone = phone.slice(2)

    if (messageType === 3)
      messageBody = messageBody.split('\n')[0].replace(/(\[.*?\])/g, '')

    //Dup Blocking
    const dupRecordCheck = await airtableHelper.airtableSearch(
      'Merchant Records',
      `OR({Business Phone Text} = ${phone}, {Owner 1 Mobile Text} = ${phone})`,
      'Scrubbing Tool'
    )
    if (dupRecordCheck?.length > 0) return res.send(`This Lead is a Dup Block`)

    //inbound lead check
    const inboundLeadCheck = await airtableHelper.airtableSearch(
      'Inbound Leads',
      `OR({Mobile Phone Formatted} = ${phone}, {Business Phone Formatted} = ${phone})`,
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
        'Customer Response': customerResponse,
        'Agent Email': agentEmails,
      } = inboundLeadCheck[0].fields

      // Get Inbound Lead ID
      const updateId = inboundLeadCheck[0].id
      // Concat prev response with new response
      const updateCustomerResponse = {
        'Customer Response': customerResponse + '\r\n' + messageBody,
      }

      const leadTypeInfo = await airtableHelper.airtableSearch(
        'Marketing Data',
        `{recordId} = '${leadType}'`,
        'Grid view'
      )

      const leadTypeName = leadTypeInfo[0].fields['Marketing Method']

      //Promises created to create the emails to send out
      const newSmsEmail = agentEmails.map(async (agentEmail) => {
        const emailAgent = await emailNotification.sendNotification(
          `${agentEmail}`,
          `SMS UPDATE ${leadTypeName} ${merchantName} ${email} ${mobilePhone}`,
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
      await Promise.all(newSmsEmail)

      // Update inbound lead with new response
      const updatedLead = await airtableHelper.airtableUpdate(
        'Inbound Leads',
        updateId,
        updateCustomerResponse
      )

      // ends statement on update
      return updatedLead
    }

    const leadSourceInfo = await airtableHelper.airtableSearch(
      'Lead Source',
      `{Lead Source} = '${leadSource}'`,
      'Grid view'
    )

    let leadSourceId
    if (leadSourceInfo?.length > 0) leadSourceId = [leadSourceInfo[0].id]

    const vendorInfo = await airtableHelper.airtableSearch(
      'Vendor List',
      `{Vendor} = '${vendor}'`,
      'Grid view'
    )

    const vendorId = vendorInfo[0].id

    //  Create Object to send to Airtable
    const airtableLead = {
      'Customer Response': messageBody,
      Email: email,
      'Merchant First Name': firstName,
      'Merchant Last Name': lastName,
      'Mobile Phone': phone,
      'Company Name': companyName,
      'Agent Status': 'New Lead',
      'Processing Status': 'New Lead',
      'Tag (Vendor)': [vendorId],
      'Lead Source (iMerchant Lead Source)': leadSourceId,
      'Lead Type (Vehicle)': leadTypeId,
      campaignID: campaignId,
    }

    await airtableHelper.airtableCreate('Inbound Leads', airtableLead)

    res.send(`New Lead Created`)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

router.post('/weprocess', async (req, res) => {
  try {
    // Deconstruct object from Ricochet

    let {
      'Lead Source': leadSource,
      Vendor: vendor,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email,
      phone,
      tags,
      company_name: companyName,
      message: { type: messageType },
      message: { body: messageBody },
      address1: address,
      state,
      city,
      location: { name: locationName },
      'Campaign ID': campaignId,
    } = req.body
    // Remove first two characters from phone +1

    if (filter.isProfane(messageBody)) return res.send(`Profane language`)

    const leadTypeId =
      locationName === 'We Process'
        ? ['recYN3IouIGLcYnNm']
        : ['recxpVfCHIqJCFTtG']
    phone = phone.slice(2)

    if (messageType === 3)
      messageBody = messageBody.split('\n')[0].replace(/(\[.*?\])/g, '')

    //inbound lead check
    const inboundLeadCheck = await airtableHelper.airtableSearch(
      'Inbound Leads',
      `OR({Mobile Phone Formatted} = ${phone}, {Business Phone Formatted} = ${phone})`,
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
        'Customer Response': customerResponse,
        'Agent Email': agentEmails,
      } = inboundLeadCheck[0].fields

      // Get Inbound Lead ID
      const updateId = inboundLeadCheck[0].id
      // Concat prev response with new response
      const updateCustomerResponse = {
        'Customer Response': customerResponse + '\r\n' + messageBody,
      }

      const leadTypeInfo = await airtableHelper.airtableSearch(
        'Marketing Data',
        `{recordId} = '${leadType}'`,
        'Grid view'
      )

      const leadTypeName = leadTypeInfo[0].fields['Marketing Method']

      //Promises created to create the emails to send out
      const newSmsEmail = agentEmails.map(async (agentEmail) => {
        const emailAgent = await emailNotification.sendNotification(
          `${agentEmail}`,
          `SMS UPDATE ${leadTypeName} ${merchantName} ${email} ${mobilePhone}`,
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
      await Promise.all(newSmsEmail)

      // Update inbound lead with new response
      const updatedLead = await airtableHelper.airtableUpdate(
        'Inbound Leads',
        updateId,
        updateCustomerResponse
      )

      // ends statement on update
      return updatedLead
    }

    const leadSourceInfo = await airtableHelper.airtableSearch(
      'Lead Source',
      `{Lead Source} = '${leadSource}'`,
      'Grid view'
    )

    let leadSourceId
    if (leadSourceInfo?.length > 0) leadSourceId = [leadSourceInfo[0].id]

    const vendorInfo = await airtableHelper.airtableSearch(
      'Vendor List',
      `{Vendor} = '${vendor}'`,
      'Grid view'
    )

    const vendorId = vendorInfo[0].id

    //  Create Object to send to Airtable
    const airtableLead = {
      'Customer Response': messageBody,
      Email: email,
      'Merchant First Name': firstName,
      'Merchant Last Name': lastName,
      'Mobile Phone': phone,
      'Company Name': companyName,
      'Agent Status': 'New Lead',
      'Processing Status': 'New Lead',
      'Tag (Vendor)': [vendorId],
      'Lead Source (iMerchant Lead Source)': leadSourceId,
      'Lead Type (Vehicle)': leadTypeId,
      campaignID: campaignId,
    }

    await airtableHelper.airtableCreate('Inbound Leads', airtableLead)

    res.send(`New Lead Created`)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
