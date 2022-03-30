const { google } = require('googleapis')
const sheets = google.sheets('v4')

async function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'keys.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  if (auth == null) {
    throw Error('authentication failed')
  }

  return auth
}

async function main() {
  const authClient = await authorize()
  const request = {
    // The ID of the spreadsheet to retrieve data from.
    spreadsheetId: '1hjjYZxtFoNE9sjbehDIcwUTquTsYzebuZbZ_cjZM5BA', // TODO: Update placeholder value.

    // The A1 notation of the values to retrieve.
    range: 'A:A', // TODO: Update placeholder value.

    // How values should be represented in the output.
    // The default render option is ValueRenderOption.FORMATTED_VALUE.
    valueRenderOption: 'FORMATTED_VALUE', // TODO: Update placeholder value.

    // How dates, times, and durations should be represented in the output.
    // This is ignored if value_render_option is
    // FORMATTED_VALUE.
    // The default dateTime render option is [DateTimeRenderOption.SERIAL_NUMBER].
    dateTimeRenderOption: 'FORMATTED_STRING', // TODO: Update placeholder value.

    auth: authClient,
  }

  try {
    const response = (await sheets.spreadsheets.values.get(request)).data
    // TODO: Change code below to process the `response` object:
    console.log(JSON.stringify(response, null, 2))
  } catch (err) {
    console.error(err)
  }
}
main()
