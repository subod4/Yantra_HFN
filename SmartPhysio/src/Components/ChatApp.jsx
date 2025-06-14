import React, { useState, useEffect, useRef } from 'react';
import { IoChatbubblesOutline, IoClose, IoSend } from 'react-icons/io5';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

function ChatApp({ sessionCode, expanded }) {
  const [isExpanded, setIsExpanded] = React.useState(!!expanded);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const location = useLocation();
  const isBicepPage = location.pathname === '/exercise/bicep-curls';

  const baseUrl = 'http://localhost:5000';

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await axios.post(`${baseUrl}/api/sessions`);
        const { session_id, message } = response.data;
        setSessionId(session_id);
        setMessages([{ id: 1, text: message, sender: 'bot' }]);
        setIsConnected(true);
      } catch (error) {
        console.error('Error initializing session:', error);
        setMessages([{ id: 1, text: 'Failed to initialize session. Please try again later.', sender: 'bot' }]);
      }
    };

    initializeSession();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue.trim(),
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    console.log("User message sent:", userMessage.text);
    console.log("Response from server:", {sessionCode, message: inputValue.trim()});

    try {
      const response = await axios.post(
        `${baseUrl}/api/sessions/${sessionCode}/chat`,
        { message: inputValue.trim(), isBicepPage } // Send the flag
      );
      console.log("Response from server:", {sessionCode, message: inputValue.trim()});

      console.log("Full response data:", response.data);
      const botMessage = {
        id: messages.length + 2,
        text: response.data.response || 'No response from the server.', // Use the correct field
        sender: 'bot',
      };
      console.log("Bot response:", botMessage.text);
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { id: messages.length + 2, text: 'Failed to send message. Please try again.', sender: 'bot' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !sessionId) return;

    setIsUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${baseUrl}/api/sessions/${sessionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log("Uploading file:", file.name, "to session:", sessionId);


      setDocumentInfo({ filename: response.data.filename });
      setUploadStatus('Upload successful!');
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleChat = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors duration-300"
        aria-label="Open chat"
      >
        <IoChatbubblesOutline size={32} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold text-lg">Chat with Support</h3>
        <button onClick={toggleChat} className="hover:text-gray-200" aria-label="Close chat">
          <IoClose size={24} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-xs ${
                message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">Typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload */}
      <div className="p-4 border-t bg-white">
        {!documentInfo ? ( // Show the upload button only if no document has been uploaded
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-600">Document uploaded: {documentInfo.filename}</p>
        )}
        {uploadStatus && <p className="mt-2 text-sm text-gray-600">{uploadStatus}</p>}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={!inputValue.trim()}
            aria-label="Send message"
          >
            <IoSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatApp;