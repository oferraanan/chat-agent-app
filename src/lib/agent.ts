import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { GetInsuranceQuoteTool, ReportAccidentTool } from "./tools";
import { ZeroShotCreatePromptArgs } from "langchain/agents";
import { BufferMemory } from "langchain/memory";
import { ChatMessageHistory } from "langchain/memory";

export const runInsuranceAgent = async (input: string) => {
  const model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
  });

  // Register tools
  const tools = [new GetInsuranceQuoteTool(), new ReportAccidentTool()];

  const agentPrompt = `
You are an insurance assistant capable of providing quotes and reporting accidents.
Follow these steps:
1. Analyze the input.
2. Use tools if needed.
3. Respond clearly.

Tools:
- ReportAccident: Use this tool to report accidents with sufficient details.
- GetInsuranceQuote: Use this tool to fetch an insurance quote.

Input: {input}
Thought: {agent_scratchpad}

  `;

  const promptArgs: ZeroShotCreatePromptArgs = {
    prefix: agentPrompt, // Pass the custom prompt as the prefix
  };

  const chatHistory = new ChatMessageHistory();

  const memory = new BufferMemory({
    memoryKey: "conversation_history",
    returnMessages: true,
    chatHistory: chatHistory, // To keep track of conversation flow
  });

  // Create an agent executor
  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    agentArgs: promptArgs,
    verbose: true,
    maxIterations: 5,
    memory
  });

  // Run the agent
  console.log("Running agent...", input);
  const result = await executor.call({ input });
  return result.output;
};
