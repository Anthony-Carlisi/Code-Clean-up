const airtableHelper = require('./airtableHelper.js')
const emailNotification = require('./emailNotifications')

// const dupBlockerCheckPhones = async (phoneNumbers) => {
//   try {
//     const dupCheckPromises = phoneNumbers.map(async (phoneNumber) => {
//       const digitsToRemove = phoneNumber.toString().length - 10
//       phoneNumber = phoneNumber.toString().slice(digitsToRemove)

//       // Merchant Records Scrubbing tool table check using Phone Number
//       const dupRecordCheck = await airtableHelper.airtableSearch(
//         'Merchant Records',
//         `OR({Business Phone Text} = ${phoneNumber}, {Owner 1 Mobile Text} = ${phoneNumber})`,
//         'Scrubbing Tool'
//       )

//       // If records is found
//       if (dupRecordCheck?.length > 0) return dupRecordCheck

//       // Funded Deals letting seniors know that merchant is shopping
//       let seniorAgentsNameArray = []
//       for (i = 0; i < dupRecordCheck.length; i++) {
//         if (dupRecordCheck[i].fields.Status === 'Funded') {
//           let seniorAgentsNames =
//             dupRecordCheck[i].fields['Senior (from Primary Assignee)']
//           if (seniorAgentsNames == undefined)
//             //if no senior found, add the primary
//             seniorAgentsNames = dupRecordCheck[i].fields['Primary Assignee'] //this will return a recID not a name
//           for (a = 0; a < seniorAgentsNames.length; a++) {
//             let dupObj = {
//               mid: dupRecordCheck[i].fields.MID,
//               name: seniorAgentsNames[a],
//             }
//             seniorAgentsNameArray.push(dupObj)
//           }
//         }
//       }

//       // Get the Email addresses of each senior agent if multiple
//       const seniorAgentsEmailsPromises = seniorAgentsNameArray.map(
//         async (seniorName) => {
//           const seniorAgentEmailSearch = await airtableHelper.airtableSearch(
//             'Agent Table',
//             `OR({Name} = '${seniorName.name}', RECORD_ID() = '${seniorName.name}')`, //check for name if there is a senior, if not search for recID
//             'Grid view'
//           )
//           if (seniorAgentEmailSearch[0].fields.Email)
//             return {
//               mid: seniorName.mid,
//               email: seniorAgentEmailSearch[0].fields.Email,
//             }
//         }
//       )

//       //Promise returning all emails to notify
//       const seniorAgentsEmails = await Promise.all(seniorAgentsEmailsPromises)

//       //Promises created to create the emails to send out
//       const seniorDupBlockNotificationPromises = seniorAgentsEmails.map(
//         async (seniorEmail) => {
//           const emailAgent = await emailNotification.sendNotification(
//             `${seniorEmail.email}`,
//             `Dup Block Notification for Funded Deal ${seniorEmail.mid}`,
//             `Your Deal ${seniorEmail.mid} Has triggered a Dup Block Your Merchant Appears to be Shopping`
//           )
//           if (emailAgent) return emailAgent
//         }
//       )

//       //Sends emails to all reciptiants
//       await Promise.all(seniorDupBlockNotificationPromises)

//       // Inbound Leads Scrubbing tool table check using Phone Number
//       const dupRecordCheckInbound = await airtableHelper.airtableSearch(
//         'Inbound Leads',
//         `OR({Mobile Phone Formatted} = ${phoneNumber}, {Business Phone Formatted} = ${phoneNumber})`,
//         'Scrubbing Tool'
//       )

//       // If records is found
//       if (dupRecordCheckInbound?.length > 0) return dupRecordCheckInbound
//     })
//     const resultsArray = await Promise.all(dupCheckPromises)
//     const results = resultsArray.filter((x) => {
//       return x !== undefined
//     })
//     return results //the list of objects that were dupblocked
//   } catch (error) {
//     console.log(error)
//   }
// }

// const dupBlockerCheckEmails = async (emails) => {
//   try {
//     const dupCheckPromises = emails.map(async (email) => {
//       if (
//         email === 'noemail@gmail.com' ||
//         email === 'noemail@noemail.com' ||
//         email === 'none@gmail.com' ||
//         email === 'no-email@gmail.com'
//       ) {
//         return undefined
//       }
//       // Merchant Records Scrubbing tool table check using Phone Number
//       const dupRecordCheck = await airtableHelper.airtableSearch(
//         'Merchant Records',
//         `OR({Email 1} = '${email}', {Owner 2 Email} = '${email}')`,
//         'Scrubbing Tool'
//       )

//       // If records is found
//       if (dupRecordCheck?.length > 0) return dupRecordCheck

//       // Funded Deals letting seniors know that merchant is shopping
//       let seniorAgentsNameArray = []
//       for (i = 0; i < dupRecordCheck.length; i++) {
//         if (dupRecordCheck[i].fields.Status === 'Funded') {
//           let seniorAgentsNames =
//             dupRecordCheck[i].fields['Senior (from Primary Assignee)']
//           if (seniorAgentsNames == undefined)
//             //if no senior found, add the primary
//             seniorAgentsNames = dupRecordCheck[i].fields['Primary Assignee'] //this will return a recID not a name
//           for (a = 0; a < seniorAgentsNames.length; a++) {
//             let dupObj = {
//               mid: dupRecordCheck[i].fields.MID,
//               name: seniorAgentsNames[a],
//             }
//             seniorAgentsNameArray.push(dupObj)
//           }
//         }
//       }

//       // Get the Email addresses of each senior agent if multiple
//       const seniorAgentsEmailsPromises = seniorAgentsNameArray.map(
//         async (seniorName) => {
//           const seniorAgentEmailSearch = await airtableHelper.airtableSearch(
//             'Agent Table',
//             `OR({Name} = '${seniorName.name}', RECORD_ID() = '${seniorName.name}')`, //check for name if there is a senior, if not search for recID
//             'Grid view'
//           )
//           if (seniorAgentEmailSearch[0].fields.Email)
//             return {
//               mid: seniorName.mid,
//               email: seniorAgentEmailSearch[0].fields.Email,
//             }
//         }
//       )

//       //Promise returning all emails to notify
//       const seniorAgentsEmails = await Promise.all(seniorAgentsEmailsPromises)

//       //Promises created to create the emails to send out
//       const seniorDupBlockNotificationPromises = seniorAgentsEmails.map(
//         async (seniorEmail) => {
//           const emailAgent = await emailNotification.sendNotification(
//             `${seniorEmail.email}`,
//             `Dup Block Notification for Funded Deal ${seniorEmail.mid}`,
//             `Your Deal ${seniorEmail.mid} Has triggered a Dup Block Your Merchant Appears to be Shopping`
//           )
//           if (emailAgent) return emailAgent
//         }
//       )

//       //Sends emails to all reciptiants
//       await Promise.all(seniorDupBlockNotificationPromises)

//       // If records is found
//       if (dupRecordCheck?.length > 0) return dupRecordCheck

//       // Inbound Leads Scrubbing tool table check using Emails
//       const dupRecordCheckInbound = await airtableHelper.airtableSearch(
//         'Inbound Leads',
//         `{Email} = '${email}'`,
//         'Scrubbing Tool'
//       )

//       // If records is found
//       if (dupRecordCheckInbound?.length > 0) return dupRecordCheckInbound
//     })
//     const resultsArray = await Promise.all(dupCheckPromises)
//     const results = resultsArray.filter((x) => {
//       return x !== undefined
//     })
//     return results //the list of objects that were dupblocked
//   } catch (error) {
//     console.log(error)
//   }
// }

const dupCheck = async (contactData, table, type) => {
  try {
    const dupCheckPromises = contactData.map(async (contact) => {
      if (type === 'phone') {
        const digitsToRemove = contact.toString().length - 10
        contact = contact.toString().slice(digitsToRemove)
      } else if (
        contact === 'noemail@gmail.com' ||
        contact === 'noemail@noemail.com' ||
        contact === 'none@gmail.com' ||
        contact === 'no-email@gmail.com' ||
        contact === ''
      ) {
        return undefined
      }

      let query
      if (table === 'Merchant Records' && type === 'phone') {
        query = `OR({Business Phone Text} = ${contact}, {Owner 1 Mobile Text} = ${contact})`
      } else if (table === 'Merchant Records' && type === 'email') {
        query = `OR({Email 1} = '${contact}', {Owner 2 Email} = '${contact}')`
      } else if (table === 'Inbound Leads' && type === 'phone') {
        query = `OR({Mobile Phone Formatted} = ${contact}, {Business Phone Formatted} = ${contact})`
      } else if (table === 'Merchant Records' && type === 'email') {
        query = `OR({Email 1} = '${contact}', {Owner 2 Email} = '${contact}')`
      }

      // Merchant Records Scrubbing tool table check using Phone Number
      const dupRecordCheck = await airtableHelper.airtableSearch(
        table,
        query,
        'Scrubbing Tool'
      )

      if (table === 'Merchant Records') {
        // Funded Deals letting seniors know that merchant is shopping
        let seniorAgentsNameArray = []
        for (i = 0; i < dupRecordCheck.length; i++) {
          if (dupRecordCheck[i].fields.Status === 'Funded') {
            let seniorAgentsNames =
              dupRecordCheck[i].fields['Senior (from Primary Assignee)']
            if (seniorAgentsNames == undefined)
              //if no senior found, add the primary
              seniorAgentsNames = dupRecordCheck[i].fields['Primary Assignee'] //this will return a recID not a name
            for (a = 0; a < seniorAgentsNames.length; a++) {
              let dupObj = {
                mid: dupRecordCheck[i].fields.MID,
                name: seniorAgentsNames[a],
              }
              seniorAgentsNameArray.push(dupObj)
            }
          }
        }

        // Get the Email addresses of each senior agent if multiple
        const seniorAgentsEmailsPromises = seniorAgentsNameArray.map(
          async (seniorName) => {
            const seniorAgentEmailSearch = await airtableHelper.airtableSearch(
              'Agent Table',
              `OR({Name} = '${seniorName.name}', RECORD_ID() = '${seniorName.name}')`, //check for name if there is a senior, if not search for recID
              'Grid view'
            )
            if (seniorAgentEmailSearch[0].fields.Email)
              return {
                mid: seniorName.mid,
                email: seniorAgentEmailSearch[0].fields.Email,
              }
          }
        )

        //Promise returning all emails to notify
        const seniorAgentsEmails = await Promise.all(seniorAgentsEmailsPromises)

        //Promises created to create the emails to send out
        const seniorDupBlockNotificationPromises = seniorAgentsEmails.map(
          async (seniorEmail) => {
            const emailAgent = await emailNotification.sendNotification(
              `${seniorEmail.email}`,
              `Dup Block Notification for Funded Deal ${seniorEmail.mid}`,
              `Your Deal ${seniorEmail.mid} Has triggered a Dup Block Your Merchant Appears to be Shopping`
            )
            if (emailAgent) return emailAgent
          }
        )

        //Sends emails to all reciptiants
        await Promise.all(seniorDupBlockNotificationPromises)
      }

      // If records is found
      if (dupRecordCheck?.length > 0) return dupRecordCheck
    })
    const resultsArray = await Promise.all(dupCheckPromises)
    const results = resultsArray.filter((x) => {
      return x !== undefined
    })
    console.log(results)
    return results //the list of objects that were dupblocked
  } catch (error) {
    console.log(error)
  }
}

// dupCheck(['martin@prestigiousmovers.com'], 'Inbound Leads', 'email')

module.exports = {
  // dupBlockerCheckEmails,
  // dupBlockerCheckPhones,
  dupCheck,
}
