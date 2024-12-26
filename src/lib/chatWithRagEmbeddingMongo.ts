import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissLibArgs, FaissStore } from "@langchain/community/vectorstores/faiss";
import { SynchronousInMemoryDocstore } from "@langchain/community/stores/doc/in_memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { OpenAI } from 'openai';
import { MongoClient } from "mongodb";

export const callLLMExample = async (collections: string[], query: string, similarityThreshold: number = 0.4) => {

  const input = "Please provide details on my property";

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  let similar = await localGetResults(["msprojects"], "Please provide details on my property");
  console.log(similar);  
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Instructions: 
        I would like the answer to be returned as an orderly WhatsApp message because I am sending it to the user,
        Please return only a STRING, not a value, not a JSON, just a string, 
        This is a message that should be sent to the cell phone, this is a WhatsApp bot, make sure there will be a line drop! And don't forget that in the end it's intended for the user, so don't put in all kinds of irrelevant texts, 
        My details are: ${similar} 
        Input: ${input} `
      },
    ],
    model: "gpt-4o",
  });
  const answer = chatCompletion.choices.map(
    (item) => item.message.content
  )[0];
  console.log(answer)
  return answer;
}


let vectorStore: FaissStore;  
// function that works when we do it local
export const localGetResults = async (collections: string[], query: string, similarityThreshold: number = 0.4) => {
  const allRelevantResults: any[] = []; 
  try {
    const client = new MongoClient('config.MongodbUri');
    const db = client.db();
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const faissArgs: FaissLibArgs = {
      docstore: new SynchronousInMemoryDocstore(),
    };
    if (!vectorStore) {
      vectorStore = new FaissStore(embeddings, faissArgs);
    
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 5000,
        chunkOverlap: 50, 
      });
      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        console.log(`Fetched ${documents.length} documents from ${collectionName}`);
        for (const doc of documents) {
          const content = JSON.stringify(doc); // Full content as JSON string
          const chunks = await textSplitter.createDocuments([content]); // Split into chunks
          for (const chunk of chunks) {
            const metadata = { sourceId: doc._id.toString(), collection: collectionName };
            await vectorStore.addDocuments([
              new Document({
                pageContent: chunk.pageContent,
                metadata: metadata, 
              }),
            ]);
          }
        }
      }
    }
    if (vectorStore) {
      const results: [Document, number][] = await vectorStore.similaritySearchWithScore(query, 10);
      const filteredResults = results.filter(([_, score]) => score >= similarityThreshold).map(([result]) => result);
      const combinedContent = filteredResults.map(doc => doc.pageContent).join(' ');
      allRelevantResults.push(combinedContent);
      console.log(`Total relevant results: ${allRelevantResults.length}`);
      return allRelevantResults;
    }
  } catch (error) {
    console.error("Error in localGetResults function:", error);
    return [];
  }
}