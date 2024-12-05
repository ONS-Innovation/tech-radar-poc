export const fetchCSVFromS3 = async () => {
  try {
    const response = await fetch('/api/csv-url');
    if (!response.ok) {
      throw new Error('Failed to fetch CSV data');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching CSV:", error);
    throw error;
  }
};