import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { getIronSession, SessionOptions } from 'iron-session';

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
        }
      }    
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      session.history.push({ role: 'user', content: message });

      let instractions = 'instructions: you are an insurance agent selling car insurance try answering relevant questions only \nquery: ';

      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: instractions + message }],
      });

      const assistantReply = chatCompletion.choices[0]?.message?.content || 'No response';
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
