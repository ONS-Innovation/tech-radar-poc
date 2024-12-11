export const fetchCSVFromS3 = async () => {
  try {
    let response;
    const baseUrl = process.env.REACT_APP_BACKEND_URL || '';
    if (process.env.NODE_ENV === "development") {
      response = await fetch(`${baseUrl}/api/csv`);
    } else {
      response = await fetch("/api/csv");
    }
    if (!response.ok) {
      throw new Error("Failed to fetch CSV data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching CSV:", error);
    throw error;
  }
};
