import { toast } from "react-hot-toast";
import { useData } from "../contexts/dataContext";

/**
 * Fetch general repository statistics
 * 
 * @param {string} [date] - Optional ISO date string to filter by last commit date
 * @param {string} [archived] - Optional 'true'/'false' to filter archived repositories
 * @returns {Promise<Object>} - The repository statistics
 */
export const fetchRepositoryStats = async (date = null, archived = null) => {
  try {
    const baseUrl = process.env.NODE_ENV === "development" 
      ? 'http://localhost:5001/api/json'
      : '/api/json';

    const params = new URLSearchParams();
    if (date && date !== "all") params.append("datetime", date);
    if (archived !== null) params.append("archived", archived);

    const url = params.toString()
      ? `${baseUrl}?${params.toString()}`
      : baseUrl;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch repository stats: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    toast.error("Error loading repository statistics.");
    return null;
  }
};

/**
 * fetchRepositoryData function to fetch repository data for specific repositories.
 *
 * @param {string[]} repositories - Array of repository names to fetch data for.
 * @param {string} [date] - Optional ISO date string to filter repositories by last commit date.
 * @param {string} [archived] - Optional 'true'/'false' to filter archived repositories.
 * @returns {Promise<Object>} - The repository data.
 */
export const fetchRepositoryData = async (
  repositories,
  date = null,
  archived = null
) => {
  try {
    if (!repositories || repositories.length === 0) {
      return null;
    }

    const params = new URLSearchParams();

    params.append("repositories", repositories.join(","));
    if (date) params.append("datetime", date);
    if (archived !== null) params.append("archived", archived);
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5001/api/repository/project/json"
        : "/api/repository/project/json";

    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch repository data: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    toast.error("Error loading repository data.");
    return null;
  }
};

/**
 * Hook wrapper for fetchRepositoryData
 * @returns {Function} - Function to fetch repository data with caching
 */
export const useRepositoryData = () => {
  const { getRepositoryData } = useData();
  return getRepositoryData;
};

/**
 * Hook wrapper for fetchRepositoryStats
 * @returns {Function} - Function to fetch repository stats with caching
 */
export const useRepositoryStats = () => {
  const { getRepositoryStats } = useData();
  return getRepositoryStats;
};
