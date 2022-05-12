//Modules
const express = require('express')
const rico = require('./hooks/RicochetHelper')
const cron = require('node-cron')
const recycle = require('./timedScripts/recycle')

//Middleware
const app = express()
app.use(express.json({ extended: false }))
app.use(
  express.urlencoded({
    extended: true,
  })
)

// Routes
app.use('/api/create', require('./routes/api/create'))
app.use('/api/tokenScrub', require('./routes/api/tokenScrub'))
app.use('/api/upload', require('./routes/api/upload'))
app.use('/api/ricoToSalesforce', require('./routes/api/ricoToSalesforce'))
app.use('/api/sfJotform', require('./routes/api/sfJotform'))
app.use('/api/popCrumbs', require('./routes/api/popCrumbs'))
app.use('/api/link', require('./routes/api/link'))
app.use('/api/sms', require('./routes/api/sms'))
app.use(
  '/api/airtableToSalesforce',
  require('./routes/api/airtableToSalesforce')
)
app.use(
  '/api/jotformSLSLandingPage',
  require('./routes/api/jotformSLSLandingPage')
)

// Ricochet Update Tag
app.post('/RicoTagUpdate', (req, res) => {
  rico.RicoUpdateTag(req.body.id, req.body.tag)
  res.sendStatus(200).end()
})

// Scheduled Tasks
cron.schedule('0 0 1 * * *', () => {
  recycle.dailyAppOutRecycle()
})
cron.schedule('0 10 1 * * *', () => {
  recycle.dailySubsCons()
})
cron.schedule('0 20 1 * * *', () => {
  recycle.dailySubsConsDavino()
})

app.listen(process.env.PORT || 4000)
