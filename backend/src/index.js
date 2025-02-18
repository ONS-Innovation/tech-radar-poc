// backend/src/index.js
/**
 * @file This is the main file for the backend server.
 * It sets up an Express server, handles CORS, and provides endpoints for fetching CSV/JSON data and checking server health.
 */
const express = require("express");
const cors = require("cors");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fetch = require("node-fetch");
const logger = require('./config/logger');
const { transformProjectToCSVFormat } = require('./utilities/projectDataTransformer');

const app = express();
const port = process.env.PORT || 5001;
const bucketName = process.env.BUCKET_NAME || "sdp-dev-digital-landscape";
const tatBucketName = process.env.TAT_BUCKET_NAME || "sdp-dev-tech-audit-tool-api";

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const s3Client = new S3Client({
  region: "eu-west-2",
});

/**
 * Endpoint for fetching project data and converting it to CSV format.
 * @route GET /api/csv
 * @returns {Object[]} Array of objects containing parsed project data in CSV format
 * @throws {Error} 500 - If data fetching or processing fails
 */
app.get("/api/csv", async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: tatBucketName,
      Key: "new_project_data.json",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Fetch the JSON data using the signed URL
    const response = await fetch(signedUrl);
    const jsonData = await response.json();

    // Transform JSON data to CSV format using the utility function
    const transformedData = jsonData.projects.map(transformProjectToCSVFormat);

    res.json(transformedData);
  } catch (error) {
    logger.error("Error fetching and transforming project data:", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint for fetching tech radar JSON data from S3. The tech data that goes on the radar and states where it belongs on the radar.
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
    // Just return the json, no need for formatting
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
      filteredRepos = jsonData.repositories.filter((repo) => {
        const lastCommitDate = new Date(repo.last_commit);
        return lastCommitDate >= targetDate && lastCommitDate <= now;
      });
    }

    // Then filter by archived status if specified
    if (archived === "true") {
      filteredRepos = filteredRepos.filter((repo) => repo.is_archived);
    } else if (archived === "false") {
      filteredRepos = filteredRepos.filter((repo) => !repo.is_archived);
    }
    // If archived is not specified, use all repos (for total view)

    // Calculate statistics
    const stats = {
      total_repos: filteredRepos.length,
      total_private_repos: filteredRepos.filter(
        (repo) => repo.visibility === "PRIVATE"
      ).length,
      total_public_repos: filteredRepos.filter(
        (repo) => repo.visibility === "PUBLIC"
      ).length,
      total_internal_repos: filteredRepos.filter(
        (repo) => repo.visibility === "INTERNAL"
      ).length,
    };

    // Calculate language statistics
    const languageStats = {};
    filteredRepos.forEach((repo) => {
      if (!repo.technologies?.languages) return;

      repo.technologies.languages.forEach((lang) => {
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
    Object.keys(languageStats).forEach((lang) => {
      languageStats[lang] = {
        repo_count: languageStats[lang].repo_count,
        average_percentage: +(
          languageStats[lang].total_percentage / languageStats[lang].repo_count
        ).toFixed(3),
        total_size: languageStats[lang].total_size,
      };
    });

    res.json({
      stats,
      language_statistics: languageStats,
      metadata: {
        last_updated:
          jsonData.metadata?.last_updated || new Date().toISOString(),
        filter_date: datetime && !isNaN(Date.parse(datetime)) ? datetime : null,
      },
    });
  } catch (error) {
    console.error("Error fetching JSON:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint for updating the tech radar JSON in S3.
 * @route POST /review/api/tech-radar/update
 * @param {Object} req.body - The update data
 * @param {Object[]} [req.body.entries] - Array of entry objects to update
 * @param {string} [req.body.title] - The title of the tech radar (for full updates)
 * @param {Object[]} [req.body.quadrants] - Array of quadrant definitions (for full updates)
 * @param {Object[]} [req.body.rings] - Array of ring definitions (for full updates)
 * @returns {Object} Success message or error response
 * @returns {string} response.message - Success confirmation message
 * @throws {Error} 400 - If entries data is invalid
 * @throws {Error} 500 - If update operation fails
 */
app.post("/review/api/tech-radar/update", async (req, res) => {
  try {
    const { entries } = req.body;

    // Validate entries is present, is an array, and is not empty
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "Invalid or empty entries data" });
    }

    const bucketName = process.env.BUCKET_NAME
      ? process.env.BUCKET_NAME
      : "sdp-dev-tech-radar";

    // First, get the existing JSON to preserve the structure
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: "onsRadarSkeleton.json",
    });

    const { Body } = await s3Client.send(getCommand);
    const existingData = JSON.parse(await Body.transformToString());

    // Get valid quadrant and ring IDs from either the update or existing data
    const validQuadrantIds = new Set(existingData.quadrants.map((q) => q.id));
    const validRingIds = new Set([
      ...existingData.rings.map((r) => r.id),
      "ignore",
      "review",
    ]);
    console.log(validQuadrantIds, validRingIds);

    // Validate each entry
    const validEntries = entries.every((entry) => {
      // Required fields validation
      if (
        !entry.id ||
        typeof entry.id !== "string" ||
        !entry.title ||
        typeof entry.title !== "string" ||
        !entry.quadrant ||
        !validQuadrantIds.has(entry.quadrant)
      ) {
        return false;
      }

      // Timeline validation
      if (!Array.isArray(entry.timeline)) return false;

      const validTimeline = entry.timeline.every(
        (t) =>
          typeof t.moved === "number" &&
          validRingIds.has(t.ringId) &&
          typeof t.date === "string" &&
          typeof t.description === "string"
      );
      if (!validTimeline) return false;

      // Optional fields validation
      if (entry.description && typeof entry.description !== "string")
        return false;
      if (entry.key && typeof entry.key !== "string") return false;
      if (entry.url && typeof entry.url !== "string") return false;
      if (entry.links && !Array.isArray(entry.links)) return false;

      return true;
    });

    if (!validEntries) {
      return res.status(400).json({ error: "Invalid entry structure" });
    }

    // Handle entries update based on count
    if (entries.length < 30) {
      // For small updates, merge with existing entries
      const existingEntriesMap = new Map(
        existingData.entries.map((entry) => [entry.id, entry])
      );

      // Update or add new entries
      entries.forEach((newEntry) => {
        existingEntriesMap.set(newEntry.id, {
          ...(existingEntriesMap.get(newEntry.id) || {}),
          ...newEntry,
        });
      });

      existingData.entries = Array.from(existingEntriesMap.values());
    } else {
      // For large updates, replace all entries
      existingData.entries = entries;
    }

    // Sort entries to maintain consistent order
    existingData.entries.sort((a, b) => {
      // First by quadrant
      if (a.quadrant !== b.quadrant) {
        return parseInt(a.quadrant) - parseInt(b.quadrant);
      }
      // Then by title
      return a.title.localeCompare(b.title);
    });

    // Save the updated JSON back to S3
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: "onsRadarSkeleton.json",
      Body: JSON.stringify(existingData, null, 2),
      ContentType: "application/json",
    });

    await s3Client.send(putCommand);
    res.json({ message: "Tech radar updated successfully" });
  } catch (error) {
    console.error("Error updating tech radar:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint for fetching specific repository information.
 * @route GET /api/repository/project/json
 * @param {string} repositories - Comma-separated list of repository names to fetch
 * @param {string} [datetime] - Optional ISO date string to filter repositories by last commit date
 * @param {string} [archived] - Optional 'true'/'false' to filter archived repositories
 * @returns {Object} Repository data
 * @returns {Object[]} response.repositories - Array of repository objects with their details
 * @returns {Object} response.stats - Repository statistics
 * @returns {Object} response.language_statistics - Language statistics for the requested repositories
 * @returns {Object} response.metadata - Last updated timestamp and repository request details
 * @throws {Error} 400 - If no repositories are specified
 * @throws {Error} 500 - If repository data fetching fails
 */
app.get("/api/repository/project/json", async (req, res) => {
  try {
    const { repositories, datetime, archived } = req.query;
    if (!repositories) {
      return res.status(400).json({ error: "No repositories specified" });
    }

    const repoNames = repositories
      .split(",")
      .map((repo) => repo.toLowerCase().trim());
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: "repositories.json",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const response = await fetch(signedUrl);
    const jsonData = await response.json();

    // Filter repositories based on provided names
    let filteredRepos = jsonData.repositories.filter((repo) =>
      repoNames.includes(repo.name.toLowerCase())
    );

    // Apply date filter if provided
    if (datetime && !isNaN(Date.parse(datetime))) {
      const targetDate = new Date(datetime);
      const now = new Date();
      filteredRepos = filteredRepos.filter((repo) => {
        const lastCommitDate = new Date(repo.last_commit);
        return lastCommitDate >= targetDate && lastCommitDate <= now;
      });
    }

    // Apply archived filter if specified
    if (archived === "true") {
      filteredRepos = filteredRepos.filter((repo) => repo.is_archived);
    } else if (archived === "false") {
      filteredRepos = filteredRepos.filter((repo) => !repo.is_archived);
    }

    // Calculate statistics from filtered repository data
    const stats = {
      total_repos: filteredRepos.length,
      total_private_repos: filteredRepos.filter(
        (r) => r.visibility === "PRIVATE"
      ).length,
      total_public_repos: filteredRepos.filter((r) => r.visibility === "PUBLIC")
        .length,
      total_internal_repos: filteredRepos.filter(
        (r) => r.visibility === "INTERNAL"
      ).length,
    };

    // Calculate language statistics
    const languageStats = {};
    filteredRepos.forEach((repo) => {
      if (!repo.technologies?.languages) return;

      repo.technologies.languages.forEach((lang) => {
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
    Object.keys(languageStats).forEach((lang) => {
      languageStats[lang] = {
        repo_count: languageStats[lang].repo_count,
        average_percentage: +(
          languageStats[lang].total_percentage / languageStats[lang].repo_count
        ).toFixed(3),
        total_size: languageStats[lang].total_size,
      };
    });

    res.json({
      repositories: filteredRepos,
      stats,
      language_statistics: languageStats,
      metadata: {
        last_updated:
          jsonData.metadata?.last_updated || new Date().toISOString(),
        requested_repos: repoNames,
        found_repos: filteredRepos.map((repo) => repo.name),
        filter_date: datetime && !isNaN(Date.parse(datetime)) ? datetime : null,
        filter_archived: archived,
      },
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
  logger.info("Health check endpoint called", {
    timestamp: new Date().toISOString(),
  });

  // Add more specific headers
  res.set({
    "Content-Type": "application/json",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
    "X-Health-Check": "true",
  });

  const healthResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
  };

  logger.debug("Health check details", healthResponse);

  res.status(200).json(healthResponse);
});

// Add error handling
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", { error });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", { promise, reason });
});

/**
 * Starts the server on the specified port.
 * It logs a message to the console when the server is running.
 */
app.listen(port, () => {
  logger.info(`Backend server running on port ${port}`);
});
