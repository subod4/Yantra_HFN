import React, { useState, useEffect, useRef } from "react";
import { IoChatbubblesOutline, IoClose, IoSend } from "react-icons/io5";
import axios from "axios";
import { useLocation } from "react-router-dom";

// Color palette to match the rest of the app
const palette = {
  primary: "bg-[#FF6F61] text-white", // orange
  primaryHover: "hover:bg-[#FFD166] hover:text-[#333333]",
  accent: "bg-[#FFD166] text-[#333333]",
  accentHover: "hover:bg-[#FF6F61] hover:text-white",
  border: "border-[#FF6F61] dark:border-[#FFD166]",
  bg: "bg-white dark:bg-neutral-800",
  header: "bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-white",
  userBubble: "bg-[#FF6F61] text-white",
  botBubble: "bg-[#FFD166] text-[#333333]",
  input:
    "border-[#FF6F61] dark:border-[#FFD166] bg-white dark:bg-neutral-800 text-[#333333] dark:text-gray-200",
  shadow: "shadow-2xl",
  fileBtn: "bg-[#FFD166] text-[#333333] hover:bg-[#FF6F61] hover:text-white",
  disabled: "bg-[#FFD166]/60 text-[#333333]/60 cursor-not-allowed",
};

function ChatApp({ sessionCode, expanded }) {
  const [isExpanded, setIsExpanded] = React.useState(!!expanded);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const location = useLocation();
  const isBicepPage = location.pathname === "/exercise/bicep-curls";

  const baseUrl = "http://localhost:5000";

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        setMessages([
          {
            id: 1,
            text: "Hi, I am Physiotherapy AI assistant",
            sender: "bot",
          },
        ]);
        setIsConnected(true);
      } catch (error) {
        setMessages([
          {
            id: 1,
            text: "Failed to initialize session. Please try again later.",
            sender: "bot",
          },
        ]);
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
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await axios.post(
        `${baseUrl}/api/sessions/${sessionCode}/chat`,
        { message: inputValue.trim(), isBicepPage }
      );
      const botMessage = {
        id: messages.length + 2,
        text: response.data.response || "No response from the server.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: messages.length + 2,
          text: "Failed to send message. Please try again.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !sessionId) return;

    setIsUploading(true);
    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${baseUrl}/api/sessions/${sessionId}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setDocumentInfo({ filename: response.data.filename });
      setUploadStatus("Upload successful!");
    } catch (error) {
      setUploadStatus("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleChat = () => {
    setIsExpanded(!isExpanded);
  };

  if (!expanded && !isExpanded) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300"
        aria-label="Open chat"
      >
        <IoChatbubblesOutline size={32} />
      </button>
    );
  }

  return (
    <div
      className={`${
        expanded ? "h-[400px] w-full" : "fixed bottom-4 right-4 h-[600px] w-96"
      } ${palette.bg} ${
        palette.shadow
      } flex flex-col border border-[#FFD166] transition-all duration-300 z-50`}
      style={{
        maxHeight: expanded ? 400 : 600,
        maxWidth: expanded ? "100%" : 384,
      }}
    >
      {/* Chat Header */}
      <div
        className={`${palette.header} p-4 rounded-t-lg flex justify-between items-center`}
      >
        <h3 className="font-bold text-lg tracking-wide flex items-center gap-2">
          <IoChatbubblesOutline size={22} className="inline" />
          SmartPhysio Chat
        </h3>
        <button
          onClick={toggleChat}
          className="hover:text-[#FFD166] transition-colors"
          aria-label="Close chat"
        >
          <IoClose size={24} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-grow min-h-0 p-4 overflow-y-auto bg-gradient-to-br from-[#FFF7ED] to-[#F4F4F4] dark:from-[#2E4F4F] dark:to-[#1A1A1A]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-3 ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-2 max-w-xs shadow-md ${
                message.sender === "user"
                  ? "bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-white"
                  : "bg-white dark:bg-neutral-700 text-[#333333] dark:text-gray-200 border border-[#FFD166] dark:border-[#FF6F61]"
              }`}
              style={{ fontSize: "1.05rem", wordBreak: "break-word" }}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="bg-white dark:bg-neutral-700 text-[#333333] dark:text-gray-200 px-4 py-2 rounded-2xl border border-[#FFD166] dark:border-[#FF6F61] shadow-md">
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-[#FFD166] bg-white dark:bg-neutral-800"
      >
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className={`flex-grow px-3 py-2 rounded-l-md border focus:outline-none focus:ring-2 focus:ring-[#FFD166] ${palette.input}`}
            style={{ fontSize: "1rem" }}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-r-md font-semibold transition-colors duration-200 ${palette.primary} ${palette.primaryHover}`}
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
