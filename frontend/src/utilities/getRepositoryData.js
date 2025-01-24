import { toast } from "react-hot-toast";

/**
 * fetchRepositoryData function to fetch repository data for specific repositories.
 * 
 * @param {string[]} repositories - Array of repository names to fetch data for.
 * @param {string} [date] - Optional ISO date string to filter repositories by last commit date.
 * @param {string} [archived] - Optional 'true'/'false' to filter archived repositories.
 * @returns {Promise<Object>} - The repository data.
 */
export const fetchRepositoryData = async (repositories, date = null, archived = null) => {
  try {
    if (!repositories || repositories.length === 0) {
      return null;
    }

    const params = new URLSearchParams();
    params.append('repositories', repositories.join(','));
    if (date) params.append('datetime', date);
    if (archived !== null) params.append('archived', archived);

    const baseUrl = process.env.NODE_ENV === "development" 
      ? 'http://localhost:5001/api/repository/project/json'
      : '/api/repository/project/json';

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch repository data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading repository data:", error);
    toast.error("Error loading repository data.");
    return null;
  }
}; 