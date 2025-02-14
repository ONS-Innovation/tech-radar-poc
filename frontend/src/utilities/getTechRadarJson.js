import { toast } from "react-hot-toast";

/**
 * fetchTechRadarJSONFromS3 function to fetch the tech radar data from S3.
 *
 * @returns {Promise<Object>} - The tech radar data containing entries array.
 */
export const fetchTechRadarJSONFromS3 = async () => {
  try {
    let response;
    if (process.env.NODE_ENV === "development") {
      response = await fetch(`http://localhost:5001/api/tech-radar/json`);
    } else {
      response = await fetch("/api/tech-radar/json");
    }
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    toast.error("Error loading tech data.");
    return null;
  }
};

/**
 * Checks if a technology name already exists (case insensitive)
 * @param {string} newTitle - The title to check
 * @param {Array} existingEntries - Array of existing tech radar entries
 * @returns {Object|null} - Returns matching entry if found, null otherwise
 */
export const findExistingTechnology = (newTitle, existingEntries) => {
  if (!newTitle || !existingEntries) return null;
  
  return existingEntries.find(
    entry => entry.title.toLowerCase() === newTitle.toLowerCase()
  );
};
