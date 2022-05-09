//Modules Needed
const ricochetHooks = require('../hooks/RicochetHelper')
const airtableHooks = require('../hooks/airtableHelper')

const dailyAppOutRecycle = async () => {
  const appOuts = await airtableHooks.airtableSearchView(
    'Merchant Records',
    'Recycle List App Out'
  )

  if (appOuts?.length <= 0) return false

  const leadPromises = appOuts.map(async (lead) => {
    let phoneArray = []

    lead.fields['Business Phone Text']
      ? phoneArray.push(lead.fields['Business Phone Text'])
      : ''
    lead.fields['Owner 1 Mobile Text']
      ? phoneArray.push(lead.fields['Owner 1 Mobile Text'])
      : ''

    if (!phoneArray) return false

    await ricochetHooks.RicoAppOutDupBlock(phoneArray)

    const recycleLeadToRicochet = {
      'Company Name': lead.fields['Legal Name'],
      'First Name': lead.fields['Merchant 1 Full Name'],
      Phone: lead.fields['Business Phone Text']
        ? lead.fields['Business Phone Text']
        : lead.fields['Owner 1 Mobile Text'],
      Email: lead.fields['Email 1'],
    }

    const leadCreated = await ricochetHooks.RicoPostNewLead(
      'https://leads.ricochet.me/api/v1/lead/create/Power-Hour?token=1ef9c4efa09e3cb6d9a31a435f711997',
      recycleLeadToRicochet
    )

    return leadCreated.status
  })

  const promisesAll = Promise.all(leadPromises)

  return promisesAll
}

// dailyAppOutRecycle()

module.exports = {
  dailyAppOutRecycle,
}
