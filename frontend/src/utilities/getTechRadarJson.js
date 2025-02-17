import { toast } from "react-hot-toast";
import { useData } from "../contexts/dataContext";

/**
 * fetchTechRadarJSONFromS3 function to fetch the tech radar data from S3.
 *
 * @returns {Promise<Object>} - The tech radar data.
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
 * Hook wrapper for fetchTechRadarJSONFromS3
 * @returns {Promise<Object>} - The tech radar data
 */
export const useTechRadarData = () => {
  const { getTechRadarData } = useData();
  return getTechRadarData;
};
