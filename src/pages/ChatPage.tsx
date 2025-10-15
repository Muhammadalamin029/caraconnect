import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeftIcon, 
  PaperAirplaneIcon, 
  UserIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { createMessage } from '../firebase/database';
import type { Message } from '../firebase/schema';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  // Mock conversations for now
  const conversations = [
    {
      id: '1',
      participant: { name: 'John Doe', avatar: '👤' },
      lastMessage: 'Thanks for completing the task!',
      timestamp: '2 min ago',
      unread: 2
    },
    {
      id: '2',
      participant: { name: 'Jane Smith', avatar: '👤' },
      lastMessage: 'When can you start?',
      timestamp: '1 hour ago',
      unread: 0
    },
    {
      id: '3',
      participant: { name: 'Mike Johnson', avatar: '👤' },
      lastMessage: 'The task is completed',
      timestamp: '3 hours ago',
      unread: 0
    }
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      setLoading(true);
      // In a real app, you would send the message to the selected conversation
      const message: Omit<Message, 'id' | 'created_at'> = {
        sender_id: user?.uid || '',
        receiver_id: selectedChat,
        content: newMessage.trim(),
        task_id: '',
        is_read: false,
        type: 'text'
      };

      await createMessage(message);
      setNewMessage('');
      toast.success('Message sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Messages</h1>
          <p className="text-slate-400">Chat with task participants</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Conversations</h2>
            </div>
            <div className="overflow-y-auto h-full">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedChat(conversation.id)}
                  className={`p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors ${
                    selectedChat === conversation.id ? 'bg-slate-700' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                      <span className="text-lg">{conversation.participant.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">
                          {conversation.participant.name}
                        </p>
                        <p className="text-xs text-slate-400">{conversation.timestamp}</p>
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unread > 0 && (
                      <div className="w-5 h-5 bg-cyan-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-slate-800 rounded-lg border border-slate-700 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {conversations.find(c => c.id === selectedChat)?.participant.name}
                      </p>
                      <p className="text-xs text-slate-400">Online</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-white">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-slate-400">
                      <p>No messages yet. Start a conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.sender_id === user?.uid
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 input-field"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !newMessage.trim()}
                      className="btn-primary flex items-center gap-2"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <UserIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
