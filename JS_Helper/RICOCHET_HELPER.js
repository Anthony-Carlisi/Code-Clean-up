const axios = require('axios');

async function RicoUpdateTag(rid, tag) {
  const options = {
    method: 'POST',
    headers: {
      'X-Auth-Token':
        'cImmWdGz7YdpetM7qdy51Ss7mBCnZei47BlY1T9DOjgNBvwGpdIlQc0i9bdl',
    },
    data: { tags: [`${tag}`] },
    url: `https://sls.ricochet.me/api/v4/leads/${rid}/tags`,
  };
  axios(options)
    .then((res) =>
      console.log(
        `Updating Ricochet Tag for ${rid} with Tag ${tag} Succeeded`,
        res.status
      )
    )
    .catch((err) =>
      console.log(
        `Updating Ricochet Tag for ${rid} with Tag ${tag} failed`,
        err
      )
    );
}

async function RicoPostNewLead(PostingURL, data) {
  const options = {
    method: 'POST',
    data: data,
    url: PostingURL,
  };
  let req = await axios(options);
  return req.data;
}

async function RicoSearch(toSearch, url) {
  var config = {
    method: 'get',
    url: url,
    headers: {
      'X-Auth-Token':
        'cImmWdGz7YdpetM7qdy51Ss7mBCnZei47BlY1T9DOjgNBvwGpdIlQc0i9bdl',
    },
    params: { search: toSearch },
  };
  let req = await axios(config);
  return req.data;
}

async function RicoUpdateLead(data) {
  var config = {
    method: 'post',
    url: 'https://sls.ricochet.me/api/v4/leads/externalupdate',
    data: data,
  };
  let req = await axios(config);
  return req.data;
}

async function RicoAppOutDupBlock(toSearch) {
  RicoSearch(toSearch, 'https://sls.ricochet.me/api/v4/leads').then(
    (response) => {
      console.log(toSearch);
      for (let i = 0; i < response.data.leads.total_results; i++) {
        console.log(response.data.leads[i]);
        if (
          response.data.leads[i].status === 'No Answer/Not In' ||
          response.data.leads[i].status === 'Not statused yet'
        ) {
          var data = {
            token:
              'cImmWdGz7YdpetM7qdy51Ss7mBCnZei47BlY1T9DOjgNBvwGpdIlQc0i9bdl',
            stc_id: response.data.leads[i].id,
            status: 'Dup Block',
          };
          RicoUpdateLead(data).then((response) => {
            return response;
          });
        }
      }
    }
  );
}

async function RicoRecycleDupBlock(toSearch) {
  RicoSearch(toSearch, 'https://sls.ricochet.me/api/v4/leads').then(
    (response) => {
      for (let i = 0; i < response.data.leads.total_results; i++) {
        console.log(response.data.leads[i]);
        if (
          (response.data.leads[i].status === 'No Answer/Not In' ||
            response.data.leads[i].status === 'Not statused yet') &&
          response.data.leads[i].vendor != 'Power-Hour' &&
          response.data.leads[i].vendor != 'Recycle-Senior' &&
          response.data.leads[i].vendor != 'Recycle-Seniors'
        ) {
          //console.log(response.data.leads[i].status + ' ' + response.data.leads[i].vendor)
          var data = {
            token:
              'cImmWdGz7YdpetM7qdy51Ss7mBCnZei47BlY1T9DOjgNBvwGpdIlQc0i9bdl',
            stc_id: response.data.leads[i].id,
            status: 'Dup Block',
          };
          RicoUpdateLead(data).then((response) => {
            return response;
          });
        }
      }
    }
  );
}

//RicoUpdateLead({"token":"cImmWdGz7YdpetM7qdy51Ss7mBCnZei47BlY1T9DOjgNBvwGpdIlQc0i9bdl","stc_id":54355422,"status":"Dup Block"}).then((response) => console.log(response))

// RicoRecycleDupBlock('18605263118')
//     console.log(response.data.calls.data)
// })
module.exports = {
  RicoPostNewLead,
  RicoUpdateTag,
  RicoSearch,
  RicoAppOutDupBlock,
  RicoRecycleDupBlock,
};
