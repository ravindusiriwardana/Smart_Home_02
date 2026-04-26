import React, { useState } from 'react';

// Design tokens (copied from Home.jsx)
const T = {
  bg:         'var(--sh-bg)',
  surface:    'var(--sh-surface)',
  surfaceAlt: 'var(--sh-surface-alt)',
  border:     'var(--sh-border)',
  borderHov:  'var(--sh-border-strong)',
  teal:       '#00c8a0',
  amber:      '#ffb932',
  coral:      '#ff6b6b',
  purple:     '#a78bfa',
  text:       'var(--sh-text)',
  textSub:    'var(--sh-text-sub)',
  textMuted:  'var(--sh-text-muted)',
  font:       "'Syne', sans-serif",
  mono:       "'Space Mono', monospace",
};

const botAvatar = (
  <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:36,height:36,borderRadius:18,background:T.teal,color:'#fff',fontWeight:700,boxShadow:'0 2px 8px #00c8a022',marginRight:8}}>
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill={T.teal}/><path d="M12 7a3 3 0 100 6 3 3 0 000-6zm0 8c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" fill="#fff"/></svg>
  </span>
);
const userAvatar = (
  <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:36,height:36,borderRadius:18,background:T.surfaceAlt,color:'#fff',fontWeight:700,boxShadow:'0 2px 8px #0002',marginLeft:8}}>
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill={T.surfaceAlt}/><path d="M12 7a3 3 0 100 6 3 3 0 000-6zm0 8c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" fill="#fff"/></svg>
  </span>
);

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
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 8px; background: ${T.surface}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFamily: T.font,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 0 5rem 0',
      }}>
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 24,
          boxShadow: '0 8px 48px #0008',
          maxWidth: 480,
          width: '100%',
          margin: '3rem 0',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            background: T.teal,
            color: '#060d14',
            fontWeight: 800,
            fontSize: 22,
            textAlign: 'center',
            padding: '1.5rem 1rem 1.1rem',
            letterSpacing: '-1px',
            borderBottom: `1px solid ${T.border}`,
            fontFamily: T.font,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" style={{marginRight:4}}><circle cx="12" cy="12" r="12" fill={T.teal}/><path d="M12 7a3 3 0 100 6 3 3 0 000-6zm0 8c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" fill="#fff"/></svg>
            Smart Home AI Chatbot
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 1.5rem',
            background: T.surface,
            minHeight: 320,
            maxHeight: 420,
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 8,
                }}
              >
                {msg.role === 'bot' && botAvatar}
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '13px 18px',
                    borderRadius: 18,
                    fontSize: 15,
                    fontFamily: T.font,
                    background: msg.role === 'user' ? T.teal : T.surfaceAlt,
                    color: msg.role === 'user' ? 'rgba(6,13,20,1)' : T.text,
                    fontWeight: 500,
                    boxShadow: '0 2px 12px #0002',
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                    borderBottomLeftRadius: msg.role === 'bot' ? 4 : 18,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {msg.text}
                </div>
                {msg.role === 'user' && userAvatar}
              </div>
            ))}
            {isLoading && (
              <div style={{display:'flex',alignItems:'flex-end',gap:8}}>
                {botAvatar}
                <div style={{background:T.surfaceAlt,padding:'13px 18px',borderRadius:18,borderBottomLeftRadius:4,color:T.text,fontStyle:'italic',fontSize:15,boxShadow:'0 2px 12px #0002'}}>Analyzing data...</div>
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} style={{
            display: 'flex', gap: 10, padding: '1.2rem', background: T.surfaceAlt, borderTop: `1px solid ${T.border}`
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your energy usage..."
              style={{
                flex: 1,
                background: T.surface,
                color: T.text,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: '13px 16px',
                fontSize: 15,
                fontFamily: T.font,
                outline: 'none',
                boxShadow: '0 1px 4px #0001',
                transition: 'border-color .15s',
              }}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                background: T.teal,
                color: '#060d14',
                border: 'none',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
                padding: '0 28px',
                boxShadow: '0 2px 12px #00c8a022',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !input.trim() ? 0.6 : 1,
                fontFamily: T.font,
                transition: 'background .15s',
              }}
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Chatbot;