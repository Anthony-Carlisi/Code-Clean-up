app.post('/hook2', (req, res) => {
  if (!filter.isProfane(req.body.message.body)) {
    console.log('Profane language found');
  }

  res.status(200).end();
  data = req.body;
  let originalString = data.message.body;
  const strippedString = originalString.replace(/(<([^>]+)>)/gi, '');
  if (
    specsFilter.some((element) => {
      return new RegExp(element, 'ig').test(strippedString);
    })
  ) {
    // var firstName = data.first_name;
    // var lastName = data.last_name;
    // var companyName = data.company_name;
    // var phone = data.phone;
    // var email = data.email;
    // var tag = data.tags;
    // var txt = data.message.body;

    let dataArray = [
      date,
      (firstName = req.body.first_name),
      (lastName = req.body.first_name),
      (companyName = req.body.first_name),
      (phone = req.body.phone),
      (email = req.body.email),
      (tag = req.body.tags),
      'campaign',
      (txt = req.body.message.body),
    ];

    async function gsrun() {
      const auth = new google.auth.GoogleAuth({
        keyFile: 'keys.json',
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
      });

      // Create client instance for auth
      const client = await auth.getClient();

      // Instance of Google Sheets API
      const googleSheets = google.sheets({ version: 'v4', auth: client });

      const spreadsheetId = '1eaVOBgMLbnL1Iptox2-2zjPpziBcRk_uoUxrreKjyoY';

      // Write row(s) to spreadsheet
      await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'SHM Filtered!A:A',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [dataArray],
        },
      });
    }

    gsrun();
  } else {
    axios
      .post('https://hooks.zapier.com/hooks/catch/3823316/b216m8j/', {
        data,
      })
      .then((res) => {
        console.log('SMS Forward For SHM');
      })
      .catch((error) => {
        console.error(error);
      });
  }
});
