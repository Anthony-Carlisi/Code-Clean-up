const airtableHelper = require('./airtableHelper.js')

module.exports = dupBlockerCheck = async (phoneNumbers) => {
  try {
    const dupCheckPromises = phoneNumbers.map(async (phoneNumber) => {
      const digitsToRemove = phoneNumber.toString().length - 10
      phoneNumber = phoneNumber.toString().slice(digitsToRemove)

      // Merchant Records Scrubbing tool table check using Phone Number
      const dupRecordCheck = await airtableHelper.airtableSearch(
        'Merchant Records',
        `OR({Business Phone Text} = ${phoneNumber}, {Owner 1 Mobile Text} = ${phoneNumber})`,
        'Scrubbing Tool'
      )

      // If records is found
      if (dupRecordCheck?.length > 0) return dupRecordCheck

      // Inbound Leads Scrubbing tool table check using Phone Number
      const dupRecordCheckInbound = await airtableHelper.airtableSearch(
        'Inbound Leads',
        `OR({Mobile Phone Formatted} = ${phoneNumber}, {Business Phone Formatted} = ${phoneNumber})`,
        'Scrubbing Tool'
      )

      // If records is found
      if (dupRecordCheckInbound?.length > 0) return dupRecordCheckInbound
    })
    const resultsArray = await Promise.all(dupCheckPromises)
    const results = resultsArray.filter((x) => {
      return x !== undefined
    })
    return results.length
  } catch (error) {
    console.log(error)
  }
}
