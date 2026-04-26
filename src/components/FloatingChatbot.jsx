import React, { useState, useRef, useEffect } from 'react';

// Design tokens (copied from Home.jsx)
const T = {
  bg:         '#060d14',
  surface:    '#0c1a27',
  surfaceAlt: '#0f2030',
  border:     'rgba(0,200,160,0.13)',
  borderHov:  'rgba(0,200,160,0.32)',
  teal:       '#00c8a0',
  amber:      '#ffb932',
  coral:      '#ff6b6b',
  purple:     '#a78bfa',
  text:       '#e8f4f8',
  textSub:    '#4a7a8a',
  textMuted:  '#1e3a4a',
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

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your Smart Home AI. Ask me anything about your energy consumption.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting to the server right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 1000,
        fontFamily: T.font,
      }}>
        {!open && (
          <button
            aria-label="Open chatbot"
            onClick={() => setOpen(true)}
            style={{
              background: T.teal,
              color: '#060d14',
              border: 'none',
              borderRadius: '50%',
              width: 64,
              height: 64,
              boxShadow: '0 4px 24px #00c8a055',
              fontSize: 28,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'box-shadow .15s',
            }}
          >
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill={T.teal}/><path d="M12 7a3 3 0 100 6 3 3 0 000-6zm0 8c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" fill="#fff"/></svg>
          </button>
        )}
        {open && (
          <div style={{
            width: 340,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            boxShadow: '0 8px 48px #0008',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              background: T.teal,
              color: '#060d14',
              fontWeight: 800,
              fontSize: 18,
              textAlign: 'center',
              padding: '1.1rem 1rem 1rem',
              letterSpacing: '-1px',
              borderBottom: `1px solid ${T.border}`,
              fontFamily: T.font,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
            }}>
              <span style={{display:'flex',alignItems:'center',gap:8}}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{marginRight:2}}><circle cx="12" cy="12" r="12" fill={T.teal}/><path d="M12 7a3 3 0 100 6 3 3 0 000-6zm0 8c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" fill="#fff"/></svg>
                Smart Home AI
              </span>
              <button aria-label="Close chatbot" onClick={() => setOpen(false)} style={{background:'none',border:'none',color:'#060d14',fontSize:22,cursor:'pointer',fontWeight:700,opacity:0.7}}>×</button>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.2rem 1rem',
              background: T.surface,
              minHeight: 180,
              maxHeight: 260,
              display: 'flex', flexDirection: 'column', gap: 14,
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
                      padding: '10px 14px',
                      borderRadius: 14,
                      fontSize: 14,
                      fontFamily: T.font,
                      background: msg.role === 'user' ? T.teal : T.surfaceAlt,
                      color: msg.role === 'user' ? '#060d14' : T.text,
                      fontWeight: 500,
                      boxShadow: '0 2px 12px #0002',
                      borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
                      borderBottomLeftRadius: msg.role === 'bot' ? 4 : 14,
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
                  <div style={{background:T.surfaceAlt,padding:'10px 14px',borderRadius:14,borderBottomLeftRadius:4,color:T.text,fontStyle:'italic',fontSize:14,boxShadow:'0 2px 12px #0002'}}>Analyzing data...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} style={{
              display: 'flex', gap: 8, padding: '1rem', background: T.surfaceAlt, borderTop: `1px solid ${T.border}`
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
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 14,
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
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '0 18px',
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
        )}
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
