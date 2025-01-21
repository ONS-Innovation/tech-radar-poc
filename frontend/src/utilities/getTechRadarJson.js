export const fetchTechRadarJSONFromS3 = async () => {
  try {
    let response;
    if (process.env.NODE_ENV === "development") {
      response = await fetch(`http://localhost:5001/api/tech-radar/json`);
    } else {
      response = await fetch("/api/tech-radar/json");
    }
    if (!response.ok) {
      throw new Error("Failed to fetch JSON data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching JSON:", error);
    throw error;
  }
};
