// backend/src/index.js
/**
 * @file This is the main file for the backend server.
 * It sets up an Express server, handles CORS, and provides endpoints for fetching CSV/JSON data and checking server health.
 */
const express = require("express");
const cors = require("cors");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const fetch = require("node-fetch");
const Papa = require("papaparse");
const logger = require('./config/logger');

const app = express();
const port = process.env.PORT || 5001;
const bucketName = process.env.BUCKET_NAME || "sdp-dev-tech-radar";

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
 * Endpoint for fetching CSV data from S3.
 * @route GET /api/csv
 * @returns {Object[]} Array of objects containing parsed CSV data
 * @returns {Object} response.data - Each row from the CSV as an object with column headers as keys
 * @throws {Error} 500 - If CSV fetching or parsing fails
 */
app.get("/api/csv", async (req, res) => {
  try {
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
        logger.error("Error parsing CSV:", { error });
        res.status(500).json({ error: "Failed to parse CSV data" });
      },
    });
  } catch (error) {
    logger.error("Error fetching CSV:", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint for fetching tech radar JSON data from S3.
 * @route GET /api/tech-radar/json
 * @returns {Object} The tech radar configuration data
 * @throws {Error} 500 - If JSON fetching fails
 */
app.get("/api/tech-radar/json", async (req, res) => {
  try {
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
 * Endpoint for fetching repository statistics.
 * @route GET /api/json
 * @param {string} [datetime] - Optional ISO date string to filter repositories by last commit date
 * @param {string} [archived] - Optional 'true'/'false' to filter archived repositories
 * @returns {Object} Repository statistics
 * @returns {Object} response.stats - General repository statistics (total, private, public, internal counts)
 * @returns {Object} response.language_statistics - Language usage statistics across repositories
 * @returns {Object} response.metadata - Last updated timestamp and filter information
 * @throws {Error} 500 - If JSON fetching fails
 */
app.get("/api/json", async (req, res) => {
  try {
    const { datetime, archived } = req.query;
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
            total_size: 0,
          };
        }
        languageStats[lang.name].repo_count++;
        languageStats[lang.name].total_percentage += lang.percentage;
        languageStats[lang.name].total_size += lang.size;
      });
    });

    // Calculate averages
    Object.keys(languageStats).forEach(lang => {
      languageStats[lang] = {
        repo_count: languageStats[lang].repo_count,
        average_percentage: +(languageStats[lang].total_percentage / languageStats[lang].repo_count).toFixed(3),
        total_size: languageStats[lang].total_size
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
 * Endpoint for fetching specific repository information.
 * @route GET /api/repository/project/json
 * @param {string} repositories - Comma-separated list of repository names to fetch
 * @returns {Object} Repository data
 * @returns {Object[]} response.repositories - Array of repository objects with their details
 * @returns {Object} response.language_statistics - Language statistics for the requested repositories
 * @returns {Object} response.metadata - Last updated timestamp and repository request details
 * @throws {Error} 400 - If no repositories are specified
 * @throws {Error} 500 - If repository data fetching fails
 */
app.get("/api/repository/project/json", async (req, res) => {
  try {
    const { repositories } = req.query;
    if (!repositories) {
      return res.status(400).json({ error: "No repositories specified" });
    }

    const repoNames = repositories.split(",").map(repo => repo.toLowerCase().trim());
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: "repositories.json",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const response = await fetch(signedUrl);
    const jsonData = await response.json();

    // Filter repositories based on provided names
    const filteredRepos = jsonData.repositories.filter(repo => 
      repoNames.includes(repo.name.toLowerCase())
    );

    // Calculate language statistics
    const languageStats = {};
    filteredRepos.forEach(repo => {
      if (!repo.technologies?.languages) return;
      
      repo.technologies.languages.forEach(lang => {
        if (!languageStats[lang.name]) {
          languageStats[lang.name] = {
            repo_count: 0,
            total_percentage: 0,
            total_size: 0,
          };
        }
        languageStats[lang.name].repo_count++;
        languageStats[lang.name].total_percentage += lang.percentage;
        languageStats[lang.name].total_size += lang.size;
      });
    });

    // Calculate averages
    Object.keys(languageStats).forEach(lang => {
      languageStats[lang] = {
        repo_count: languageStats[lang].repo_count,
        average_percentage: +(languageStats[lang].total_percentage / languageStats[lang].repo_count).toFixed(3),
        total_size: languageStats[lang].total_size
      };
    });

    res.json({
      repositories: filteredRepos,
      language_statistics: languageStats,
      metadata: {
        last_updated: jsonData.metadata?.last_updated || new Date().toISOString(),
        requested_repos: repoNames,
        found_repos: filteredRepos.map(repo => repo.name)
      }
    });
  } catch (error) {
    console.error("Error fetching repository data:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check endpoint to verify server status.
 * @route GET /api/health
 * @returns {Object} Health status information
 * @returns {string} response.status - Server status ('healthy')
 * @returns {string} response.timestamp - Current server timestamp
 * @returns {number} response.uptime - Server uptime in seconds
 * @returns {Object} response.memory - Memory usage statistics
 * @returns {number} response.pid - Process ID
 */
app.get("/api/health", (req, res) => {
  logger.info("Health check endpoint called", { timestamp: new Date().toISOString() });
  
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

  logger.debug("Health check details", healthResponse);
  
  res.status(200).json(healthResponse);
});

// Add error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { promise, reason });
});

/**
 * Starts the server on the specified port.
 * It logs a message to the console when the server is running.
 */
app.listen(port, () => {
  logger.info(`Backend server running on port ${port}`);
});
