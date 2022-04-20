//Modules Needed
const express = require('express')

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
// //UPDATE RICOCHET TAG
// app.post('/RicoTagUpdate', (req, res) => {
//   rico.RicoUpdateTag(req.body.id, req.body.tag)
//   res.sendStatus(200).end()
// })

app.listen(process.env.PORT || 4000)
