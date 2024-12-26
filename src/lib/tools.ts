//import { Tool } from "@langchain/core/tools";
import { Tool } from "langchain/tools";
import { getInsuranceQuote, reportAccident } from "./insuranceAPI";

/**
 * Tool for getting insurance quotes (car or house).
 */
export class GetInsuranceQuoteTool extends Tool {
  name = "GetInsuranceQuote";
  description = "Fetch a car or house insurance quote based on user details. Input should be a JSON string with type ('car' or 'house') and details.";

  // The method to handle the tool's functionality
  async _call(input: string): Promise<string> {
    console.log('GetInsuranceQuoteTool', input)
    try {
      const { type, details } = JSON.parse(input); // Parse input
      if (type !== "car" && type !== "house") {
        throw new Error("Type must be 'car' or 'house'");
      }
      const quote = await getInsuranceQuote(type, details); // Call API
      return `Here is your ${type} insurance quote: ${JSON.stringify(quote, null, 2)}`;
    } catch (error) {
      return `Error fetching insurance quote: ${error}`;
    }
  }
}

/**
 * Tool for reporting accidents.
 */
export class ReportAccidentTool extends Tool {
  name = "ReportAccident";
  description = "Report an accident by providing claim details as a JSON string.";

  // The method to handle the tool's functionality
  async _call(input: string): Promise<string> {
    console.log('ReportAccidentTool', input)
    try {
      const claimDetails = JSON.parse(input); // Parse input
      const report = await reportAccident(claimDetails); // Call API
      return `Your accident report has been filed: ${JSON.stringify(report, null, 2)}`;
    } catch (error) {
      return `Error reporting accident: ${error}`;
    }
  }
}
