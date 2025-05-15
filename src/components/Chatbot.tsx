  import { useState, useRef, useEffect } from "react";
  import { motion } from "framer-motion";

  type Message = {
    sender: "user" | "bot";
    text: string;
    image?: string;
  };

  export default function Chatbot() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionKey, setSessionKey] = useState<string | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!sessionKey) {
        const newSessionKey = "user_" + Date.now();
        setSessionKey(newSessionKey);
      }
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sessionKey]);

    const sendMessage = async () => {
      if (!input.trim()) return;

      const userMessage: Message = { sender: "user", text: input };
      setMessages(prev => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const sanitizedMessage = input.replace(/[\n\r]/g, " ");

        const response = await fetch("https://vanii2.app.n8n.cloud/webhook-test/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: sanitizedMessage,
            sessionKey: sessionKey,
          }),
        });

        const resText = await response.text();

        let data;
        try {
          data = JSON.parse(resText);
        } catch (err) {
          console.error("JSON parse error:", resText);
          setMessages(prev => [
            ...prev,
            {
              sender: "bot",
              text: `${resText}`,
            },
          ]);
          setLoading(false);
          return;
        }

        const reply =
          data?.response?.generations?.[0]?.[0]?.text ??
          data?.reply ??
          "Không tìm thấy phản hồi từ bot.";

        setMessages(prev => [...prev, { sender: "bot", text: reply }]);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
        setMessages(prev => [...prev, { sender: "bot", text: `Lỗi: ${msg}` }]);
      }

      setLoading(false);
    };

    const sendImage = (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const imageMessage: Message = {
          sender: "user",
          text: "Đã gửi 1 hình ảnh",
          image: base64,
        };
        setMessages(prev => [...prev, imageMessage]);
      };
      reader.readAsDataURL(file);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        sendImage(file);
      }
    };

    return (
      <div>
        {/* Nút mở/đóng chatbox */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-10 w-20 h-20 right-10 bg-yellow-300 text-white p-4 rounded-full shadow-lg"
        >
          💬
        </button>

        {/* Chatbox Popup */}
        {isChatOpen && (
          <motion.div
            className="fixed bottom-10 right-10 w-[700px] bg-white rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="bg-yellow-300 text-white p-4 font-bold text-center rounded-t-lg">
              Chatbot hỗ trợ
              <p>{sessionKey ? `${sessionKey}` : "Đang tạo session..."}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
              {/* Logo */}
              <div className="flex justify-center">
                <img src="/logo.png" alt="Logo" />
              </div>

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-yellow-300 text-black"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {msg.image && (
                      <img src={msg.image} alt="uploaded" className="mb-2 rounded-lg" />
                    )}
                    <p style={{ whiteSpace: "pre-line" }}>{msg.text}</p>
                  </div>
                </div>
              ))}

              {/* Loading Typing */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-black p-3 rounded-2xl max-w-[70%] animate-pulse">
                    Bot đang trả lời...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 flex gap-2 border-t">
              <input
                type="text"
                className="flex-1 border rounded-l-lg p-2 focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Nhập tin nhắn..."
              />
              <button className="bg-yellow-300 text-white px-4 rounded-r-lg" onClick={sendMessage}>
                Gửi
              </button>
              <button
                className="bg-gray-200 text-black px-2 rounded-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                📷
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Close Button */}
            <div className="absolute top-2 right-2">
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white bg-red-500 p-5 rounded-lg"
              >
                Ẩn
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
