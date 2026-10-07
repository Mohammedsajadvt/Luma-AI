'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Paperclip,
  Mic,
  ArrowUp,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Menu,
  X,
  Lock,
  Download,
  LogIn,
  LogOut,
  PenTool,
  Code2,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function ChatPage() {
  const { data: session, status } = useSession();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);



  const textareaRef = useRef(null);
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Dynamic greeting
  const [greeting, setGreeting] = useState('Good afternoon');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch conversations from MongoDB when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetchConversations();
    }
  }, [status]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Toast trigger
  const showToast = (msg) => {
    setToastText(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  // API: Fetch Conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.warn('Could not fetch conversations:', e);
    }
  };

  // API: Select and Load Conversation Messages
  const selectConversation = async (id) => {
    setActiveConvId(id);
    setSidebarOpen(false);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          (data.messages || []).map(m => ({
            role: m.role,
            content: m.content,
            attachment: m.attachment,
            id: m._id || String(Math.random()),
          }))
        );
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  };

  // Create New Chat
  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputPrompt('');
    setAttachedFile(null);
    setSidebarOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  // Delete Conversation
  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c._id !== id));
        if (activeConvId === id) {
          handleNewChat();
        }
        showToast('Conversation deleted');
      }
    } catch (e) {
      showToast('Error deleting conversation');
    }
  };

  // Send Message & Stream AI Response
  const handleSendMessage = async (customPrompt = null, attachmentData = null) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() && !attachedFile && !attachmentData) return;
    if (isGenerating) return;

    const currentAttachment = attachmentData || attachedFile;
    const userMsg = {
      role: 'user',
      content: promptToSend,
      attachment: currentAttachment ? { name: currentAttachment.name } : null,
      id: String(Date.now()),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setAttachedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsGenerating(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          conversationId: activeConvId,
          model: selectedModel,
          attachment: currentAttachment ? {
            name: currentAttachment.name,
            size: currentAttachment.size,
            type: currentAttachment.type,
          } : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantReply = '';
      let convId = activeConvId;
      let buffer = '';

      // Temporary placeholder assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '', id: 'streaming-temp' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          const trimmedEvent = event.trim();
          if (!trimmedEvent) continue;

          const lines = trimmedEvent.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr.trim() === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text !== undefined) {
                  assistantReply += parsed.text;
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === 'streaming-temp'
                        ? { ...m, content: assistantReply }
                        : m
                    )
                  );
                }
                if (parsed.conversationId && !convId) {
                  convId = parsed.conversationId;
                  setActiveConvId(convId);
                  fetchConversations();
                }
              } catch (jsonErr) {
                // Ignore incomplete json
              }
            }
          }
        }
      }

      // Finalize message id
      setMessages(prev =>
        prev.map(m =>
          m.id === 'streaming-temp'
            ? { ...m, id: String(Date.now()), content: assistantReply }
            : m
        )
      );


      // Refresh list to show title if new
      fetchConversations();
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'streaming-temp'),
        {
          role: 'assistant',
          content: `⚠️ Error communicating with AI server: ${err.message}. Please check your connection or OpenAI API settings.`,
          id: String(Date.now()),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Textarea Auto Expand
  const handleInputChange = (e) => {
    setInputPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // Keyboard shortcut: Cmd+K / Ctrl+K & Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  };

  // Export chat transcript
  const handleExport = () => {
    if (messages.length === 0) {
      showToast('No messages to export');
      return;
    }
    const transcript = messages
      .map(m => `### ${m.role.toUpperCase()}\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported conversation');
  };

  // MongoDB User Sign In / Registration
  const handleCredentialsSignIn = async (name, email, password) => {
    const finalName = (name || customName || '').trim();
    const finalEmail = (email || customEmail || '').trim();
    const finalPassword = (password || customPassword || '').trim();

    if (!finalEmail) {
      showToast('Please enter your email address');
      return;
    }
    if (!finalPassword) {
      showToast('Please enter your password');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        name: finalName,
        email: finalEmail,
        password: finalPassword,
      });
      if (res?.ok) {
        setAuthModalOpen(false);
        setCustomPassword('');
        showToast(`Signed in successfully!`);
        fetchConversations();
      } else {
        showToast(res?.error || 'Invalid email or password');
      }
    } catch (err) {
      showToast('Error during sign-in');
    } finally {
      setAuthLoading(false);
    }
  };


  const userName = session?.user?.name || 'Guest';
  const userInitials = session?.user?.name
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'G';

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR (Dark Navy) */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="logo-icon-wrap">
              <Sparkles className="sparkle-icon" size={18} />
            </div>
            <span className="brand-name">Luma AI</span>
          </div>
          <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* New Chat CTA */}
        <div className="sidebar-cta-wrap">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <span className="btn-left">
              <Plus size={16} strokeWidth={2.5} />
              <span className="btn-label">New chat</span>
            </span>
            <span className="shortcut-pill">⌘ K</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="sidebar-search-wrap">
          <div className="search-input-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            {searchFilter && (
              <button className="clear-search-btn" onClick={() => setSearchFilter('')}>
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Section Header */}
        <div className="sidebar-section-header">
          <span className="section-title">RECENT</span>
        </div>

        {/* Conversation List */}
        <div className="chat-history-list">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <div
                key={conv._id}
                className={`chat-item ${activeConvId === conv._id ? 'active' : ''}`}
                onClick={() => selectConversation(conv._id)}
              >
                <div className="chat-item-left">
                  <MessageSquare size={15} className="chat-item-icon" />
                  <span className="chat-item-title">{conv.title}</span>
                </div>
                {activeConvId === conv._id && <span className="chat-item-indicator" />}
                <div className="chat-item-actions">
                  <button
                    className="chat-action-del"
                    title="Delete conversation"
                    onClick={(e) => deleteConversation(e, conv._id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '14px', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
              {status === 'authenticated' ? 'No recent chats' : 'Sign in to sync history with MongoDB'}
            </div>
          )}
        </div>

        {/* User Profile Footer & Auth */}
        <div className="sidebar-footer">
          {session ? (
            <div className="user-profile" onClick={() => signOut()}>
              <div className="user-avatar">
                {session.user?.image ? (
                  <img src={session.user.image} alt={userName} />
                ) : (
                  userInitials
                )}
              </div>
              <div className="user-info">
                <div className="user-name">{userName}</div>
                <div className="user-plan">MongoDB Synced • Sign out</div>
              </div>
              <LogOut size={16} color="#94a3b8" />
            </div>
          ) : (
            <div className="user-profile" onClick={() => setAuthModalOpen(true)}>
              <div className="user-avatar" style={{ background: '#4285F4' }}>
                <LogIn size={18} />
              </div>
              <div className="user-info">
                <div className="user-name">Sign In / Connect</div>
                <div className="user-plan">Sync history to MongoDB</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <main className="main-canvas">
        {/* Top Nav Header */}
        <header className="top-nav">
          <div className="nav-left">
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>

            {/* Model Selector Dropdown */}
            <div className="model-dropdown-wrap">
              <button
                className="model-selector-btn"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              >
                <span className="model-name">
                  {selectedModel === 'gemini-1.5-pro'
                    ? '✨ Gemini 1.5 Pro'
                    : '✨ Gemini 1.5 Flash'}
                </span>
                <ChevronDown size={14} className="chevron-down" />
              </button>

              {modelDropdownOpen && (
                <div className="model-menu">
                  <div
                    className={`model-option ${selectedModel === 'gemini-1.5-flash' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedModel('gemini-1.5-flash');
                      setModelDropdownOpen(false);
                      showToast('Switched to Gemini 1.5 Flash');
                    }}
                  >
                    <div className="model-opt-info">
                      <div className="model-opt-title">
                        Gemini 1.5 Flash <span className="badge-rec">Default</span>
                      </div>
                      <div className="model-opt-desc">Blazing speed • 1M token context</div>
                    </div>
                    {selectedModel === 'gemini-1.5-flash' && <Check size={16} color="#059669" />}
                  </div>

                  <div
                    className={`model-option ${selectedModel === 'gemini-1.5-pro' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedModel('gemini-1.5-pro');
                      setModelDropdownOpen(false);
                      showToast('Switched to Gemini 1.5 Pro');
                    }}
                  >
                    <div className="model-opt-info">
                      <div className="model-opt-title">Gemini 1.5 Pro</div>
                      <div className="model-opt-desc">Complex coding, math & deep reasoning</div>
                    </div>
                    {selectedModel === 'gemini-1.5-pro' && <Check size={16} color="#059669" />}
                  </div>
                </div>
              )}
            </div>



            {/* Online Status */}
            <div className="status-badge" title="AI service online">
              <span className="status-dot" />
              <span className="status-text">ONLINE</span>
            </div>
          </div>

          <div className="nav-right">
            <div className="private-badge" title="Private & secure session">
              <Lock size={13} />
              <span>Private chat</span>
            </div>

            <button className="icon-action-btn" title="Export Markdown" onClick={handleExport}>
              <Download size={16} />
            </button>

            {!session && (
              <button className="auth-btn-pill" onClick={() => setAuthModalOpen(true)}>
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Chat Viewport */}
        <div className="chat-viewport">
          {messages.length === 0 ? (
            /* WELCOME HERO STATE */
            <div className="welcome-container">
              <div className="hero-sparkle-badge">
                <Sparkles className="hero-sparkle-svg" size={28} />
              </div>
              <h1 className="hero-heading">{greeting}, {userName.split(' ')[0]}</h1>
              <p className="hero-subheading">How can I help you create something great?</p>

              {/* 3 Suggestion Prompt Cards */}
              <div className="prompt-cards-grid">
                <div
                  className="prompt-card"
                  onClick={() =>
                    handleSendMessage(
                      'Write a high-converting launch email for a new productivity app that helps founders prioritize tasks automatically.'
                    )
                  }
                >
                  <div className="card-icon-badge badge-purple">
                    <PenTool size={18} />
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Help me write</h3>
                    <p className="card-desc">Write a short launch email for a new productivity app</p>
                  </div>
                </div>

                <div
                  className="prompt-card"
                  onClick={() =>
                    handleSendMessage(
                      'Explain React Server Components and Next.js 14 App Router data fetching in simple terms with code examples.'
                    )
                  }
                >
                  <div className="card-icon-badge badge-blue">
                    <Code2 size={18} />
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Explain code</h3>
                    <p className="card-desc">Explain React Server Components in simple terms</p>
                  </div>
                </div>

                <div
                  className="prompt-card"
                  onClick={() =>
                    handleSendMessage(
                      'Create a detailed visual concept prompt for a modern, serene minimalist workspace with ambient lighting.'
                    )
                  }
                >
                  <div className="card-icon-badge badge-orange">
                    <ImageIcon size={18} />
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Create an image</h3>
                    <p className="card-desc">Create a visual concept for a peaceful workspace</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE MESSAGES STREAM */
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={msg.role === 'user' ? 'message-row-user' : 'message-row-ai'}
                >
                  {msg.role === 'assistant' && (
                    <div className="ai-avatar-badge">
                      <Sparkles size={18} />
                    </div>
                  )}

                  {msg.role === 'user' ? (
                    <div className="user-bubble">
                      {msg.attachment && (
                        <div className="attached-file-tag">
                          <Paperclip size={13} />
                          <span>{msg.attachment.name}</span>
                        </div>
                      )}
                      <div>{msg.content}</div>
                    </div>
                  ) : (
                    <div className="ai-card">
                      <div className="ai-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      <div className="ai-card-actions">
                        <button
                          className="card-action-btn"
                          onClick={() => copyToClipboard(msg.content)}
                          title="Copy message"
                        >
                          <Copy size={14} />
                          <span>Copy</span>
                        </button>
                        <button
                          className="card-action-btn"
                          onClick={() => showToast('Feedback recorded')}
                          title="Good response"
                        >
                          <ThumbsUp size={14} />
                        </button>
                        <button
                          className="card-action-btn"
                          onClick={() => showToast('Feedback recorded')}
                          title="Bad response"
                        >
                          <ThumbsDown size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.role === 'user' && (
                    <div className="user-avatar-tag">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt={userName} />
                      ) : (
                        userInitials
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isGenerating && (
                <div className="typing-indicator-wrap">
                  <div className="ai-avatar-badge">
                    <Sparkles size={18} />
                  </div>
                  <div className="typing-card">
                    <div className="typing-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="typing-label">Luma is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* FLOATING MESSAGE COMPOSER */}
        <div className="composer-container">
          {attachedFile && (
            <div className="attachment-preview-bar" style={{ display: 'flex' }}>
              <div className="preview-item">
                <Paperclip size={14} />
                <span className="file-name">{attachedFile.name}</span>
                <button
                  className="remove-file-btn"
                  onClick={() => setAttachedFile(null)}
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          <div className="composer-card">
            <div className="composer-top-row">
              <textarea
                ref={textareaRef}
                className="message-textarea"
                placeholder="Ask Luma anything..."
                rows={1}
                value={inputPrompt}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="composer-bottom-row">
              <div className="composer-left-actions">
                <label className="composer-action-btn" title="Attach file">
                  <Paperclip size={18} />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setAttachedFile(e.target.files[0]);
                        showToast(`Attached: ${e.target.files[0].name}`);
                      }
                    }}
                  />
                </label>

                {/* Tools Dropdown */}
                <div className="tools-dropdown-wrap">
                  <button
                    className="tools-pill-btn"
                    onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                  >
                    <Sparkles size={14} color="#10b981" />
                    <span>Tools</span>
                    <ChevronDown size={12} />
                  </button>

                  {toolsDropdownOpen && (
                    <div className="tools-popover">
                      <div className="tools-header">AI Capabilities</div>
                      <label className="tool-item">
                        <input type="checkbox" defaultChecked />
                        <div className="tool-info">
                          <span className="tool-name">Web Search</span>
                          <span className="tool-sub">Live web citations</span>
                        </div>
                      </label>
                      <label className="tool-item">
                        <input type="checkbox" defaultChecked />
                        <div className="tool-info">
                          <span className="tool-name">Code Execution</span>
                          <span className="tool-sub">Run JavaScript/Python</span>
                        </div>
                      </label>
                      <label className="tool-item">
                        <input type="checkbox" defaultChecked />
                        <div className="tool-info">
                          <span className="tool-name">MongoDB Sync</span>
                          <span className="tool-sub">Persistent user memory</span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="composer-right-actions">
                <button className="composer-action-btn" title="Voice Input">
                  <Mic size={18} />
                </button>
                <button
                  className="send-btn"
                  disabled={(!inputPrompt.trim() && !attachedFile) || isGenerating}
                  onClick={() => handleSendMessage()}
                  aria-label="Send message"
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <p className="composer-disclaimer">
            Luma can make mistakes. Verify important facts.
          </p>
        </div>
      </main>

      {/* AUTHENTICATION MODAL */}
      {authModalOpen && (
        <div
          className="modal-backdrop open"
          onClick={(e) => {
            if (e.target.classList.contains('modal-backdrop')) {
              setAuthModalOpen(false);
            }
          }}
        >
          <div className="modal-card" style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="logo-icon-wrap" style={{ width: '28px', height: '28px' }}>
                  <Sparkles size={16} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Sign in to Luma AI</h3>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                style={{ fontSize: '1.4rem', color: '#94a3b8', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Sign in with your email and password to securely save your chat history directly to MongoDB Atlas.
            </p>

            {/* Direct MongoDB Profile Sign In */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCredentialsSignIn(customName, customEmail, customPassword);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                  Your Name <span style={{ fontWeight: 400, color: '#94a3b8' }}>(for profile)</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    color: '#1e293b',
                    background: '#ffffff',
                  }}
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    color: '#1e293b',
                    background: '#ffffff',
                  }}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      color: '#1e293b',
                      background: '#ffffff',
                    }}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      background: 'transparent',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '11px',
                  background: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  opacity: authLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {authLoading ? 'Signing in...' : 'Sign In / Register with MongoDB'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Toast Notification */}
      <div className={`toast-notification ${toastVisible ? 'show' : ''}`}>
        <Check size={16} color="#6ee7b7" />
        <span>{toastText}</span>
      </div>
    </div>
  );
}

