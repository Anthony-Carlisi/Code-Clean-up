const axios = require('axios')
const config = require('config')

const RicoUpdateTag = async (rid, tag) => {
  try {
    const leadUpdate = await axios({
      method: 'POST',
      headers: { 'X-Auth-Token': config.get('token') },
      data: { tags: [`${tag}`] },
      url: `${config.get('apiUrl')}/${rid}/tags`,
    })
    //Looking for status true on the return
    return leadUpdate.data.status
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
}

// RicoUpdateTag('77937572', 'ARs')

const RicoPostNewLead = async (PostingURL, data) => {
  try {
    const options = {
      method: 'POST',
      data: data,
      url: PostingURL,
    }
    const newLead = await axios(options)
    return newLead.data
  } catch (err) {
    console.error(err.message)
  }
}

const RicoSearch = async (toSearch) => {
  try {
    const searchPromises = toSearch.map(async (phone) => {
      return await axios({
        method: 'get',
        url: config.get('apiUrl'),
        headers: { 'X-Auth-Token': config.get('token') },
        params: { search: `${phone}` },
      })
    })
    const searchResults = await Promise.all(searchPromises)
    return searchResults.data
  } catch (err) {
    console.error(err.message)
  }
}

const RicoUpdateLead = async (data) => {
  try {
    const updateLead = await axios({
      method: 'post',
      url: `${config.get('apiUrl')}/externalupdate`,
      data: data,
    })
    return updateLead.data
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
}

const RicoAppOutDupBlock = async (toSearch) => {
  try {
    const searchResults = await RicoSearch(toSearch, config.get('apiUrl'))

    if (searchResults.data.leads.total_results?.length <= 0) return false

    const leadsArray = searchResults.data.leads

    for (let i = 0; i < leadsArray.total_results; i++) {
      const leadToUpdate = {
        token: config.get('token'),
        stc_id: leadsArray[i].id,
        status: 'Dup Block',
      }

      leadsArray[i].status === 'No Answer/Not In' ||
      leadsArray[i].status === 'Not statused yet'
        ? await RicoUpdateLead(leadToUpdate)
        : false
    }
  } catch (err) {
    console.error(err.message)
  }
}

RicoAppOutDupBlock(['5163034649', '5167994050'])

// const RicoRecycleDupBlock = async (toSearch) => {
//   try {
//     const searchResults = await RicoSearch(toSearch, config.get('apiUrl'))

//     if (searchResults.data.leads.total_results?.length <= 0) return false

//     const leadsArray = searchResults.data.leads

//     for (let i = 0; i < leadsArray.total_results; i++) {
//       const leadToUpdate =
//         {
//           token: config.get('token'),
//           stc_id: leadsArray[i].id,
//           status: 'Dup Block',
//         }(
//           leadsArray[i].status === 'No Answer/Not In' ||
//             leadsArray[i].status === 'Not statused yet'
//         ) &&
//         leadsArray[i].status != 'Power-Hour' &&
//         leadsArray[i].status != 'Recycle-Senior' &&
//         leadsArray[i].status != 'Recycle-Seniors'
//           ? await RicoUpdateLead(leadToUpdate)
//           : false
//     }
//   } catch (err) {
//     console.error(err.message)
//     res.status(500).send('Server Error')
//   }
// }

module.exports = {
  RicoPostNewLead,
  RicoUpdateTag,
  RicoSearch,
  RicoAppOutDupBlock,
  // RicoRecycleDupBlock,
}
