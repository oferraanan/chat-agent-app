import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { getIronSession, SessionOptions } from 'iron-session';
import { runInsuranceAgent } from "../../lib/agent";

import * as fs from 'fs';
import pdf from 'pdf-parse'

async function extractTextFromPDF(filePath: string) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text;
}

import xlsx from 'xlsx'
function extractTextFromExcel(filePath: string) {
    const workbook = xlsx.readFile(filePath);
    let extractedText = '';
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        extractedText += xlsx.utils.sheet_to_csv(sheet);
    });
    return extractedText;
}

import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'

let vectorStore: MemoryVectorStore

async function generateEmbeddings(documents: any) {
    const embeddings = new OpenAIEmbeddings({ 
      apiKey: process.env.OPENAI_API_KEY ,
      model: "text-embedding-ada-002",
      batchSize: 512,
      stripNewLines: true,
    });
    vectorStore = new MemoryVectorStore(embeddings);

    for (const [docName, text] of Object.entries(documents)) {
        await vectorStore.addDocuments([{
            id: docName,
            metadata: {},
            pageContent: (text as string),
        }]);
    }
    return vectorStore;
}


import { Tool } from 'langchain/tools'
/**
 * Tool for vector search.
 */
export class VectorSearchTool extends Tool {
  name = "Vector Search";
  description = "Searches the in-memory vector store for the most relevant documents.";

  // Implement the _call method
  async _call(query: { vector: string }): Promise<string> {
    try {
      // Perform a similarity search on the in-memory vector store
      const results = await vectorStore.similaritySearch(query.vector, 3); // 3 results as an example

      // Return the search results as a JSON string
      return JSON.stringify(results, null, 2);
    } catch (error) {
      return `Error performing vector search: ${error}`;
    }
  }
}


interface ChatMessage {
    role: string;
    content: string;
}

const sessionOptions: SessionOptions = {
            password: process.env.SESSION_PASSWORD ? process.env.SESSION_PASSWORD :'' ,
            cookieName: 'my-chat-session',
            cookieOptions: {
              secure: process.env.NODE_ENV === 'production', // Use true in production for https
            },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === 'POST') {
    try {
      const session = await getIronSession<{history: ChatMessage[]}>(req, res, sessionOptions);
      //session.history = session.history || [];
      // Clean the session at the start of the chat
      if (!session.history) {
          session.history = [] as ChatMessage[]; // Initialize history if it doesn't exist
      } else {
        if(req.query['init'] === 'true') {
          session.history = [] as ChatMessage[]; // Reset session history to an empty array
          await session.save();
          res.status(200).json({});
          return;
        }
      }    
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      session.history.push({ role: 'user', content: message });

      const assistantReply = await runInsuranceAgent(message);
      console.warn(assistantReply);
/*
      let instractions = 'instructions: you are an insurance agent selling car insurance try answering relevant questions only \nquery: ';
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: instractions + message }],
      });
      const assistantReply = chatCompletion.choices[0]?.message?.content || 'No response';
*/
      session.history.push({ role: 'assistant', content: assistantReply });

      // Save the session state
      await session.save();

      console.log(session)

      res.status(200).json({ reply: assistantReply });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
