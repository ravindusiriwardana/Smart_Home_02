import React, { useState } from 'react';

function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your Smart Home AI. Ask me anything about your energy consumption.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat',  {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting to the server right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] p-6">
      
      <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl flex flex-col overflow-hidden max-w-4xl mx-auto w-full border border-white/10">
        
        <div className="bg-gray-800/50 p-4 text-white text-center font-bold text-xl border-b border-white/10">
          Smart Home AI Assistant
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[70%] p-3 rounded-xl text-white ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 rounded-br-none' 
                    : 'bg-gray-700/80 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-gray-700/80 p-3 rounded-xl rounded-bl-none text-white italic">
                  Analyzing data...
               </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-gray-900/40 border-t border-white/10 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your energy usage..."
            className="flex-1 bg-white/20 text-white placeholder-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>

      </div>
    </div>
  );
}

export default Chatbot;