import { useState, useEffect, useRef } from 'react';
import useStore from '../../store/useStore';

export default function Chatbox() {
    const socket = useStore(state => state.socket);
    const room = useStore(state => state.room);
    const user = useStore(state => state.user);

    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleChat = (data) => {
            const sender = data.username || 'Unknown';
            setMessages(prev => [...prev, { sender, text: data.message }]);
            useStore.getState().setChatBubble(sender, data.message);
        };

        const handleServerMsg = (data) => {
            if (data.message) {
                setMessages(prev => [...prev, { sender: 'System', text: data.message, isSystem: true }]);
            }
        };

        const handlePuzzleSolved = (data) => {
            if (data.message) {
                setMessages(prev => [...prev, { sender: 'System', text: data.message, isSystem: true }]);
            }
        };

        socket.on('receive_chat', handleChat);
        socket.on('server_message', handleServerMsg);
        socket.on('puzzle_solved', handlePuzzleSolved);

        return () => {
            socket.off('receive_chat', handleChat);
            socket.off('server_message', handleServerMsg);
            socket.off('puzzle_solved', handlePuzzleSolved);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() && socket && room) {
            socket.emit('send_chat', {
                roomId: room,
                message: inputValue.trim(),
                username: user?.username || `Player_${socket.id.substring(0, 4)}`
            });
            setInputValue('');
        }
    };

    return (
        <div className="absolute bottom-32 left-6 w-80 h-64 bg-[#110d0a]/90 backdrop-blur-md border border-[#3a2a18] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.1)_inset] flex flex-col overflow-hidden pointer-events-auto z-50 rounded-sm">
            {/* Header */}
            <div className="bg-[#1c1611] border-b border-[#3a2a18] px-3 py-1.5 flex items-center justify-between">
                <span className="text-[#a08a70] text-xs tracking-[0.2em] uppercase">Comms Link</span>
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse shadow-[0_0_5px_#d4af37]"></div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-[#3a2a18]">
                {messages.length === 0 && (
                    <div className="text-[#5a4a38] text-xs italic text-center mt-2">Silence...</div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className="text-sm leading-snug break-words">
                        <span className={`font-bold mr-2 tracking-wide ${msg.isSystem ? 'text-[#e74c3c]' : 'text-[#d4af37]'}`}>
                            [{msg.sender}]
                        </span>
                        <span className={msg.isSystem ? 'text-[#c0392b] italic' : 'text-[#e8dcb8] font-sans'}>
                            {msg.text}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-2 bg-[#0c0a08] border-t border-[#3a2a18]">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Whisper to others..."
                    className="w-full bg-transparent text-[#e8dcb8] text-sm outline-none placeholder-[#5a4a38] px-2 py-1 font-sans"
                    maxLength={150}
                />
            </form>
        </div>
    );
}
