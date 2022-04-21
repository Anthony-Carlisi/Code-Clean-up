const dupBlockCheck = require('./dupBlockerCheck')

const test = async () => {
  const test = await dupBlockCheck.dupBlockerCheck(
    ['5163034649'],
    'Inbound Leads',
    'phone'
  )
  console.log(test)
}

test()
