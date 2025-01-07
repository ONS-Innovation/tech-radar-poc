// backend/src/index.js
/**
 * @file This is the main file for the backend server.
 * It sets up an Express server, handles CORS, and provides endpoints for fetching CSV data and checking server health.
 */

const express = require("express");
const cors = require("cors");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fetch = require("node-fetch");
const Papa = require("papaparse");

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const s3Client = new S3Client({
  region: "eu-west-2",
});

/**
 * Endpoint for fetching CSV data.
 * It fetches the CSV data from an S3 bucket, parses it, and returns the parsed data.
 */
app.get("/api/csv", async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: "sdp-dev-tech-radar",
      Key: "onsTechDataAdoption.csv",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Fetch the CSV data using the signed URL
    const response = await fetch(signedUrl);
    const csvText = await response.text();

    // Parse the CSV data and filter out empty or incomplete entries
    Papa.parse(csvText, {
      header: true,
      complete: (results) => {
        const filteredData = results.data.filter(entry => Object.keys(entry).length > 1);
        res.json(filteredData);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        res.status(500).json({ error: "Failed to parse CSV data" });
      },
    });
  } catch (error) {
    console.error("Error fetching CSV:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint for checking server health.
 * It returns a 200 status and the message "healthy" if the server is running.
 */
app.options('/api/health', cors());

app.get("/api/health", (req, res) => {
  console.log("Health check endpoint called at:", new Date().toISOString());
  
  // Add more specific headers
  res.set({
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'X-Health-Check': 'true'
  });
  
  const healthResponse = { 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  };

  console.log("Health check:", healthResponse.timestamp);
  
  res.status(200).json(healthResponse);
});

// Add error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Starts the server on the specified port.
 * It logs a message to the console when the server is running.
 */
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
