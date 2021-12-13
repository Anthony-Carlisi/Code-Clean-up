const AWS = require('aws-sdk');
const fs = require('fs');
const { DownloaderHelper } = require('node-downloader-helper');

var file = [
  'https://sls.imerchantsystems.com//contents/_29ea28.jpg',
  'https://sls.imerchantsystems.com//contents/APP_6fb9af.pdf',
  'https://sls.imerchantsystems.com//contents/0177_AUG15_BANK_485656.pdf',
  'https://sls.imerchantsystems.com//contents/0177_JULY15_BANK_b45e1b.pdf',
  'https://sls.imerchantsystems.com//contents/0177_JUNE15_BANK_65ca8a.pdf',
  'https://sls.imerchantsystems.com//contents/0177_SEPT15_BANK_bf2b3f.pdf',
  'https://sls.imerchantsystems.com//contents/6033_APRIL15_BANK_d83f56.pdf',
  'https://sls.imerchantsystems.com//contents/6033_MARCH15_BANK_e0acfc.pdf',
  'https://sls.imerchantsystems.com//contents/6033_AUG15_BANK_35a5a6.pdf',
  'https://sls.imerchantsystems.com//contents/6033_JULY15_BANK_5b3863.pdf',
  'https://sls.imerchantsystems.com//contents/6033_JUNE15_BANK_f3647a.pdf',
];

// Enter copied or downloaded access ID and secret key here
const ID = 'AKIAZI7K3TMQ7QF7PA6X';
const SECRET = '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';

// The name of the bucket that you have created
const BUCKET_NAME = 'straightlinesource-crm-files';

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
});

const uploadFile = (fileName) => {
  // Read content from the file
  const fileContent = fs.readFileSync(fileName);
  // Setting up S3 upload parameters
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName, // File name you want to save as in S3
    Body: fileContent,
  };
  // Uploading files to the bucket
  s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
    fs.unlinkSync(fileName);
  });
};

for (let i = 0; i < file.length; i++) {
  let filePath = `${__dirname}`;
  let dl = new DownloaderHelper(file[i], filePath);
  dl.on('end', () => uploadFile(dl.__fileName));
  dl.start();
}

// // URL of the image
// const file = 'https://sls.imerchantsystems.com//contents/_29ea28.jpg';
// // Path at which image will be downloaded
// const filePath = `${__dirname}`;

// const dl = new DownloaderHelper(file, filePath);

// dl.on('end', () =>
//   console.log('Download Completed' && uploadFile(dl.__fileName))
// );
// dl.start();
