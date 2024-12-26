'use client';
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string; content: string }[]>([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat_agent?init=false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const botMessage = { role: 'assistant', content: data.reply };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const initChat = async () => {
    setInput('');
    const userMessage = { role: 'user', content: '' };
    setMessages([]);
    
    try {
      const response = await fetch('/api/chat_agent?init=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      //const botMessage = { role: 'assistant', content: data.reply };

      //setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
    }
  };


  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Insurance Chat Agent with OpenAI - Ofer Raanan</h1>
      <div style={{ border: '1px solid #ccc', padding: '1rem', height: '400px', overflowY: 'scroll' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ margin: '0.5rem 0' }}>
            <strong>{msg.role === 'user' ? 'You:' : 'AI:'}</strong> {msg.content}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
          placeholder="Type a message..."
          style={{ width: '80%', padding: '0.5rem', borderWidth: 2 }}
        />
        <button onClick={sendMessage} style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem', borderWidth: 1 }}>
          Send
        </button>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={initChat} style={{ padding: '0.5rem 1rem', borderWidth: 1 }}>
          Restart Conversation
        </button>
      </div>
    </div>
  );
}
