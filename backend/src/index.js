// backend/src/index.js
/**
 * @file This is the main file for the backend server.
 * It sets up an Express server, handles CORS, and provides endpoints for fetching CSV data and checking server health.
 */

const express = require("express");
const cors = require("cors");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
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
    const bucketName = process.env.BUCKET_NAME ? process.env.BUCKET_NAME : "sdp-dev-tech-radar";
    const command = new GetObjectCommand({
      Bucket: bucketName,
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
 * Endpoint for fetching CSV data.
 * It fetches the CSV data from an S3 bucket, parses it, and returns the parsed data.
 */
app.get("/api/tech-radar/json", async (req, res) => {
  try {
    const bucketName = process.env.BUCKET_NAME ? process.env.BUCKET_NAME : "sdp-dev-tech-radar";
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: "onsRadarSkeleton.json",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Fetch the CSV data using the signed URL
    const response = await fetch(signedUrl);
    const jsonData = await response.json();

    res.json(jsonData);
  } catch (error) {
    console.error("Error fetching JSON:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint for fetching repository statistics from JSON data.
 * It fetches the JSON data from an S3 bucket and returns the statistics.
 */
app.get("/api/json", async (req, res) => {
  try {
    const { datetime, archived } = req.query;
    const bucketName = process.env.BUCKET_NAME ? process.env.BUCKET_NAME : "sdp-dev-tech-radar";
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: "repositories.json",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Fetch the JSON data using the signed URL
    const response = await fetch(signedUrl);
    const jsonData = await response.json();

    // First filter by date if provided
    let filteredRepos = jsonData.repositories;
    
    if (datetime && !isNaN(Date.parse(datetime))) {
      const targetDate = new Date(datetime);
      const now = new Date();
      filteredRepos = jsonData.repositories.filter(repo => {
        const lastCommitDate = new Date(repo.last_commit);
        return lastCommitDate >= targetDate && lastCommitDate <= now;
      });
    }

    // Then filter by archived status if specified
    if (archived === 'true') {
      filteredRepos = filteredRepos.filter(repo => repo.is_archived);
    } else if (archived === 'false') {
      filteredRepos = filteredRepos.filter(repo => !repo.is_archived);
    }
    // If archived is not specified, use all repos (for total view)

    // Calculate statistics
    const stats = {
      total_repos: filteredRepos.length,
      total_private_repos: filteredRepos.filter(repo => repo.visibility === 'PRIVATE').length,
      total_public_repos: filteredRepos.filter(repo => repo.visibility === 'PUBLIC').length,
      total_internal_repos: filteredRepos.filter(repo => repo.visibility === 'INTERNAL').length,
    };

    // Calculate language statistics
    const languageStats = {};
    filteredRepos.forEach(repo => {
      if (!repo.technologies?.languages) return;
      
      repo.technologies.languages.forEach(lang => {
        if (!languageStats[lang.name]) {
          languageStats[lang.name] = {
            repo_count: 0,
            total_percentage: 0,
            total_lines: 0,
          };
        }
        languageStats[lang.name].repo_count++;
        languageStats[lang.name].total_percentage += lang.percentage;
        languageStats[lang.name].total_lines += lang.size;
      });
    });

    // Calculate averages
    Object.keys(languageStats).forEach(lang => {
      languageStats[lang] = {
        repo_count: languageStats[lang].repo_count,
        average_percentage: +(languageStats[lang].total_percentage / languageStats[lang].repo_count).toFixed(3),
        average_lines: +(languageStats[lang].total_lines / languageStats[lang].repo_count).toFixed(3),
      };
    });

    res.json({
      stats,
      language_statistics: languageStats,
      metadata: {
        last_updated: jsonData.metadata?.last_updated || new Date().toISOString(),
        filter_date: datetime && !isNaN(Date.parse(datetime)) ? datetime : null
      }
    });
  } catch (error) {
    console.error("Error fetching JSON:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint for updating the tech radar JSON in S3.
 * It receives the updated entries and saves them back to the S3 bucket.
 */
app.post("/api/tech-radar/update", async (req, res) => {
  return res.json({ message: "Feature not available yet." });
  try {
    const { entries } = req.body;
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: "Invalid entries data" });
    }

    const bucketName = process.env.BUCKET_NAME ? process.env.BUCKET_NAME : "sdp-dev-tech-radar";
    
    // First, get the existing JSON to preserve the structure
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: "onsRadarSkeleton.json",
    });

    const { Body } = await s3Client.send(getCommand);
    const existingData = JSON.parse(await Body.transformToString());
    
    // Create a map of existing entries for easy lookup
    const existingEntriesMap = new Map(existingData.entries.map(entry => [entry.id, entry]));
    
    // Update entries while preserving all properties
    const updatedEntries = entries.map(newEntry => {
      const existingEntry = existingEntriesMap.get(newEntry.id);
      if (!existingEntry) return newEntry;

      return {
        ...existingEntry,
        timeline: newEntry.timeline, // Only update the timeline
      };
    });

    // Sort entries to maintain consistent order
    updatedEntries.sort((a, b) => {
      // First by quadrant
      if (a.quadrant !== b.quadrant) {
        return parseInt(a.quadrant) - parseInt(b.quadrant);
      }
      // Then by title
      return a.title.localeCompare(b.title);
    });

    // Update only the entries array while preserving everything else
    existingData.entries = updatedEntries;

    // Save the updated JSON back to S3
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: "onsRadarSkeleton.json",
      Body: JSON.stringify(existingData, null, 2),
      ContentType: "application/json"
    });

    await s3Client.send(putCommand);
    res.json({ message: "Tech radar updated successfully" });
  } catch (error) {
    console.error("Error updating tech radar:", error);
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
