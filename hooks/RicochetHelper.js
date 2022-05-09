const axios = require('axios')

const token = 'cImmWdGz7YdpetM7qdy51Ss7mBCnZei47BlY1T9DOjgNBvwGpdIlQc0i9bdl'
const apiUrl = 'https://sls.ricochet.me/api/v4/leads'

const RicoUpdateTag = async (rid, tag) => {
  try {
    const options = {
      method: 'POST',
      headers: { 'X-Auth-Token': token },
      data: { tags: [`${tag}`] },
      url: `${apiUrl}/${rid}/tags`,
    }
    const leadUpdate = await axios(options)
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
  } catch (error) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
}

const RicoSearch = async (toSearch, url) => {
  try {
    const options = {
      method: 'get',
      url: url,
      headers: { 'X-Auth-Token': token },
      params: { search: toSearch },
    }
    const search = await axios(options)
    return search.data
  } catch (error) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
}

const RicoUpdateLead = async (data) => {
  try {
    const options = {
      method: 'post',
      url: `${apiUrl}/externalupdate`,
      data: data,
    }
    const updateLead = await axios(options)
    return updateLead.data
  } catch (error) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
}

const RicoAppOutDupBlock = async (toSearch) => {
  try {
    const searchResults = await RicoSearch(toSearch, apiUrl)

    if (searchResults.data.leads.total_results?.length <= 0) return false

    const leadsArray = searchResults.data.leads

    for (let i = 0; i < leadsArray.total_results; i++) {
      const leadToUpdate = {
        token: token,
        stc_id: leadsArray[i].id,
        status: 'Dup Block',
      }

      leadsArray[i].status === 'No Answer/Not In' ||
      leadsArray[i].status === 'Not statused yet'
        ? await RicoUpdateLead(leadToUpdate)
        : false
    }
  } catch (error) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
}

// RicoAppOutDupBlock('5163034649')

const RicoRecycleDupBlock = async (toSearch) => {
  try {
    const searchResults = await RicoSearch(toSearch, apiUrl)

    if (searchResults.data.leads.total_results?.length <= 0) return false

    const leadsArray = searchResults.data.leads

    for (let i = 0; i < leadsArray.total_results; i++) {
      const leadToUpdate =
        {
          token: token,
          stc_id: leadsArray[i].id,
          status: 'Dup Block',
        }(
          leadsArray[i].status === 'No Answer/Not In' ||
            leadsArray[i].status === 'Not statused yet'
        ) &&
        leadsArray[i].status != 'Power-Hour' &&
        leadsArray[i].status != 'Recycle-Senior' &&
        leadsArray[i].status != 'Recycle-Seniors'
          ? await RicoUpdateLead(leadToUpdate)
          : false
    }
  } catch (error) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
}

module.exports = {
  RicoPostNewLead,
  RicoUpdateTag,
  RicoSearch,
  RicoAppOutDupBlock,
  RicoRecycleDupBlock,
}
