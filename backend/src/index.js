// backend/src/index.js
const express = require('express');
const cors = require('cors');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fetch = require('node-fetch');
const Papa = require('papaparse');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const s3Client = new S3Client({
  region: "eu-west-2"
  // No need to specify credentials - will use ECS task role
});

app.get('/csv-url', async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: "sdp-dev-tech-radar",
      Key: "onsTechDataAdoption.csv",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    
    // Fetch the CSV data using the signed URL
    const response = await fetch(signedUrl);
    const csvText = await response.text();
    
    // Parse the CSV data
    Papa.parse(csvText, {
      header: true,
      complete: (results) => {
        res.json(results.data);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        res.status(500).json({ error: 'Failed to parse CSV data' });
      }
    });
  } catch (error) {
    console.error('Error fetching CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('healthy');
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});