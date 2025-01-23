import { toast } from "react-hot-toast";

/**
 * fetchRepositoryData function to fetch repository data for specific repositories.
 * 
 * @param {string[]} repositories - Array of repository names to fetch data for.
 * @returns {Promise<Object>} - The repository data.
 */
export const fetchRepositoryData = async (repositories) => {
  try {
    if (!repositories || repositories.length === 0) {
      return null;
    }

    const repoQueryString = repositories.join(",");
    let response;
    if (process.env.NODE_ENV === "development") {
      response = await fetch(`http://localhost:5001/api/repository/project/json?repositories=${repoQueryString}`);
    } else {
      response = await fetch(`/api/repository/project/json?repositories=${repoQueryString}`);
    }
    
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