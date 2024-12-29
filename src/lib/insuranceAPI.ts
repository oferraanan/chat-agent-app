import axios from "axios";

export interface InsuranceDetails {
  type: "car" | "house";
  details: any;
}

export interface AccidentDetails {
  policyNumber: string;
  description: string;
  date: string;
  photos?: string[]; // Optional URLs or file paths to photos
}

// Simulate fetching insurance quotes
export const getInsuranceQuote = async (
  type: "car" | "house",
  details: any
): Promise<any> => {
  try {
    // Replace this with a real API endpoint if available
    //const apiUrl = `https://mock-insurance-api.com/quote/${type}`;
    //const response = await axios.post(apiUrl, details);
    //return response.data;
    return '{"small": "1000", "medium": 1500, "fancy": 2000 }'
  } catch (error) {
    console.error("Error fetching insurance quote:", error);
    throw new Error("Failed to fetch insurance quote.");
  }
};

// Simulate reporting an accident
export const reportAccident = async (claimDetails: AccidentDetails): Promise<any> => {
  try {
    // Replace this with a real API endpoint if available
    //const apiUrl = "https://mock-insurance-api.com/report-accident";
    //const response = await axios.post(apiUrl, claimDetails);
    //return response.data;
    return '{"status": "Reported successfuly"}'
  } catch (error) {
    console.error("Error reporting accident:", error);
    throw new Error("Failed to report the accident.");
  }
};
