/**
 * Luma AI — Frontend Interactive Application
 * High fidelity chatbot controller matching Figma specifications
 */

// --- Default Data & State ---
const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-1',
    title: 'Landing page copy ideas',
    messages: [
      {
        sender: 'user',
        text: 'Help me draft high-converting hero copy for an AI notes app named "Zenith".',
        timestamp: '10:14 AM'
      },
      {
        sender: 'ai',
        text: `Here are three high-converting hero headline options tailored for **Zenith AI**:\n\n### Option 1: Outcome & Clarity-Driven\n> **"Never lose a great idea again."**\n> *Zenith automatically transcribes, organizes, and connects your spontaneous thoughts into structured knowledge in seconds.*\n\n### Option 2: Flow State & Minimalism\n> **"Your second brain, without the clutter."**\n> *Capture thoughts at the speed of speech. Zenith AI turns scattered ideas into polished documents instantly.*\n\n### Key Conversion Elements Included:\n- **Immediate hook:** Focuses on eliminating memory friction\n- **Micro-copy CTA suggestion:** *"Start capturing for free — no credit card required"*`,
        timestamp: '10:14 AM'
      }
    ]
  },
  {
    id: 'conv-2',
    title: 'React performance tips',
    messages: [
      {
        sender: 'user',
        text: 'How can I optimize expensive re-renders in React 18+?',
        timestamp: 'Yesterday'
      },
      {
        sender: 'ai',
        text: `To eliminate redundant re-renders and boost frame rates in React 18+, follow these proven patterns:\n\n1. **Push State Down to Leaf Components:** Keep state as localized as possible so parent re-renders don't trigger subtree reconciliations.\n2. **Memoize Complex Computations:** Use \`useMemo\` for heavy transformations.\n\n\`\`\`javascript\nimport React, { useMemo } from 'react';\n\nfunction AnalyticsDashboard({ rawData, filter }) {\n  // Memoize expensive sorting/filtering\n  const processedStats = useMemo(() => {\n    return rawData\n      .filter(item => item.category === filter)\n      .map(item => computeDeepMetrics(item));\n  }, [rawData, filter]);\n\n  return <DataGrid items={processedStats} />;\n}\n\`\`\`\n\n3. **Transition Non-urgent Updates:** Wrap secondary state updates in \`startTransition()\` to avoid blocking the main UI thread.`,
        timestamp: 'Yesterday'
      }
    ]
  },
  {
    id: 'conv-3',
    title: 'Tokyo 5-day itinerary',
    messages: [
      {
        sender: 'user',
        text: 'Create a balanced 5-day itinerary for Tokyo combining tech, food, and traditional culture.',
        timestamp: '2 days ago'
      },
      {
        sender: 'ai',
        text: `Here is a curated 5-day Tokyo highlights itinerary:\n\n- **Day 1 (Modern Tech & Neon):** Shibuya Crossing, Shinjuku Gyoen National Garden, Omoide Yokocho evening food crawl.\n- **Day 2 (Traditional Heritage):** Asakusa Senso-ji temple, river cruise to Hamarikyu Gardens, Ginza dining.\n- **Day 3 (Pop Culture & Digital Art):** teamLab Planets in Toyosu, Akihabara electronics exploration.\n- **Day 4 (Foodie Immersion):** Tsukiji Outer Market sushi breakfast, Roppongi Hills observation deck.\n- **Day 5 (Art & Relaxation):** Meiji Jingu Shrine, Harajuku boutiques, sunset over Meguro river.`,
        timestamp: '2 days ago'
      }
    ]
  },
  {
    id: 'conv-4',
    title: 'Quarterly report summary',
    messages: []
  },
  {
    id: 'conv-5',
    title: 'Learn Spanish practice',
    messages: []
  }
];

// App State
const state = {
  conversations: [...INITIAL_CONVERSATIONS],
  activeConvId: null, // null = new chat welcome screen
  isGenerating: false,
  selectedModel: 'Luma 2.0',
  attachedFile: null,
  isPrivate: true,
  preferences: {
    stream: true,
    sound: true,
    autoScroll: true
  }
};

// --- DOM Elements ---
const chatHistoryList = document.getElementById('chatHistoryList');
const welcomeContainer = document.getElementById('welcomeContainer');
const messagesContainer = document.getElementById('messagesContainer');
const chatViewport = document.getElementById('chatViewport');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const typingIndicator = document.getElementById('typingIndicator');
const greetingHeading = document.getElementById('greetingHeading');
const chatSearchInput = document.getElementById('chatSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchFocusBtn = document.getElementById('searchFocusBtn');
const modelDropdownWrap = document.getElementById('modelDropdownWrap');
const modelSelectorBtn = document.getElementById('modelSelectorBtn');
const selectedModelLabel = document.getElementById('selectedModelLabel');
const modelMenu = document.getElementById('modelMenu');
const toolsBtn = document.getElementById('toolsBtn');
const toolsDropdownWrap = document.getElementById('toolsDropdownWrap');
const fileAttachmentInput = document.getElementById('fileAttachmentInput');
const attachmentPreviewBar = document.getElementById('attachmentPreviewBar');
const previewFileName = document.getElementById('previewFileName');
const removeFileBtn = document.getElementById('removeFileBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const sidebar = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const mobileCloseBtn = document.getElementById('mobileCloseBtn');
const mobileOverlay = document.getElementById('mobileOverlay');
const settingsModal = document.getElementById('settingsModal');
const userProfileBtn = document.getElementById('userProfileBtn');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const exportChatBtn = document.getElementById('exportChatBtn');
const privacyToggleBtn = document.getElementById('privacyToggleBtn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  updateTimeGreeting();
  renderSidebarChats();
  setupEventListeners();
  setupPromptCards();
});

// Update dynamic greeting (Morning, Afternoon, Evening)
function updateTimeGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good morning, Alex';
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon, Alex';
  } else if (hour >= 17) {
    greeting = 'Good evening, Alex';
  }
  if (greetingHeading) {
    greetingHeading.textContent = greeting;
  }
}

// Render recent conversations in sidebar
function renderSidebarChats(filter = '') {
  chatHistoryList.innerHTML = '';
  
  const filtered = state.conversations.filter(c => 
    c.title.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    chatHistoryList.innerHTML = `
      <div style="padding: 12px 14px; color: #64748b; font-size: 0.8rem; text-align: center;">
        No conversations found
      </div>`;
    return;
  }

  filtered.forEach(conv => {
    const item = document.createElement('div');
    item.className = `chat-item ${state.activeConvId === conv.id ? 'active' : ''}`;
    item.dataset.id = conv.id;

    item.innerHTML = `
      <div class="chat-item-left">
        <svg class="chat-item-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="chat-item-title">${escapeHtml(conv.title)}</span>
      </div>
      ${state.activeConvId === conv.id ? '<span class="chat-item-indicator"></span>' : ''}
      <div class="chat-item-actions">
        <button class="chat-action-del" title="Delete chat" data-delete-id="${conv.id}">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.chat-action-del')) {
        deleteConversation(conv.id);
        return;
      }
      selectConversation(conv.id);
      closeMobileSidebar();
    });

    chatHistoryList.appendChild(item);
  });
}

// Select and load a conversation
function selectConversation(id) {
  state.activeConvId = id;
  renderSidebarChats(chatSearchInput.value);

  const conv = state.conversations.find(c => c.id === id);
  if (!conv || conv.messages.length === 0) {
    showWelcomeScreen();
  } else {
    showMessagesView(conv.messages);
  }
}

// Show Welcome State
function showWelcomeScreen() {
  welcomeContainer.style.display = 'flex';
  messagesContainer.style.display = 'none';
  messagesContainer.innerHTML = '';
}

// Show Messages Stream State
function showMessagesView(messages) {
  welcomeContainer.style.display = 'none';
  messagesContainer.style.display = 'flex';
  messagesContainer.innerHTML = '';

  messages.forEach(msg => {
    appendMessageToDOM(msg, false);
  });

  scrollChatToBottom();
}

// Create new chat
function createNewChat() {
  state.activeConvId = null;
  state.attachedFile = null;
  clearAttachmentPreview();
  renderSidebarChats(chatSearchInput.value);
  showWelcomeScreen();
  messageInput.value = '';
  adjustTextareaHeight();
  messageInput.focus();
  closeMobileSidebar();
}

// Delete conversation
function deleteConversation(id) {
  state.conversations = state.conversations.filter(c => c.id !== id);
  if (state.activeConvId === id) {
    createNewChat();
  } else {
    renderSidebarChats(chatSearchInput.value);
  }
  showToast('Conversation removed');
}

// Setup Prompt Suggestion Cards
function setupPromptCards() {
  const cards = document.querySelectorAll('.prompt-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const promptText = card.dataset.prompt;
      const category = card.dataset.category;
      sendUserMessage(promptText, category);
    });
  });
}

// Handle sending messages
function handleSendMessage() {
  const text = messageInput.value.trim();
  if (!text && !state.attachedFile) return;
  if (state.isGenerating) return;

  const promptToSend = text || (state.attachedFile ? `Please analyze this uploaded file: ${state.attachedFile.name}` : '');
  const fileToSend = state.attachedFile;

  messageInput.value = '';
  adjustTextareaHeight();
  clearAttachmentPreview();
  sendBtn.disabled = true;

  sendUserMessage(promptToSend, null, fileToSend);
}

// Core Send Function
function sendUserMessage(text, category = null, attachment = null) {
  // If in welcome state, create or assign conversation
  if (!state.activeConvId) {
    const newId = 'conv-' + Date.now();
    const snippetTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
    const newConv = {
      id: newId,
      title: snippetTitle,
      messages: []
    };
    state.conversations.unshift(newConv);
    state.activeConvId = newId;
    renderSidebarChats();
  }

  // Switch to messages stream if hidden
  welcomeContainer.style.display = 'none';
  messagesContainer.style.display = 'flex';

  const userMsg = {
    sender: 'user',
    text: text,
    timestamp: getCurrentTime(),
    attachment: attachment
  };

  // Add to active conversation
  const currentConv = state.conversations.find(c => c.id === state.activeConvId);
  if (currentConv) {
    currentConv.messages.push(userMsg);
  }

  appendMessageToDOM(userMsg, true);
  scrollChatToBottom();

  // Trigger simulated AI streaming response
  triggerAIResponse(text, category);
}

// Append a single message element to DOM
function appendMessageToDOM(msg, animate = true) {
  if (msg.sender === 'user') {
    const row = document.createElement('div');
    row.className = 'message-row-user';
    
    let attachmentHTML = '';
    if (msg.attachment) {
      attachmentHTML = `
        <div class="attached-file-tag">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
          <span>${escapeHtml(msg.attachment.name)}</span>
        </div>`;
    }

    row.innerHTML = `
      <div class="user-bubble">
        ${attachmentHTML}
        <div>${escapeHtml(msg.text)}</div>
      </div>
      <div class="user-avatar-tag">AM</div>
    `;
    messagesContainer.appendChild(row);
  } else {
    const row = document.createElement('div');
    row.className = 'message-row-ai';
    row.innerHTML = `
      <div class="ai-avatar-badge">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z"/></svg>
      </div>
      <div class="ai-card">
        <div class="ai-content">${formatMarkdown(msg.text)}</div>
        ${msg.image ? `
          <div class="generated-image-card">
            <img src="${msg.image}" alt="Generated AI Visual" loading="lazy" />
            <div class="image-card-caption">✨ Generated by Luma Vision 2.0</div>
          </div>
        ` : ''}
        <div class="ai-card-actions">
          <button class="card-action-btn copy-msg-btn" title="Copy response">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
          </button>
          <button class="card-action-btn reaction-btn" title="Helpful response">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
          </button>
          <button class="card-action-btn reaction-btn" title="Improve response">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
          </button>
        </div>
      </div>
    `;

    // Attach copy event
    const copyBtn = row.querySelector('.copy-msg-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(msg.text);
        showToast('Response copied to clipboard');
      });
    }

    // Attach reaction feedback
    const reactionBtns = row.querySelectorAll('.reaction-btn');
    reactionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        showToast('Feedback submitted');
      });
    });

    messagesContainer.appendChild(row);
  }
}

// Simulated dynamic AI Responses with streaming text
function triggerAIResponse(userPrompt, category) {
  state.isGenerating = true;
  typingIndicator.style.display = 'flex';
  scrollChatToBottom();

  let responseData = generateResponseContent(userPrompt, category);

  setTimeout(() => {
    typingIndicator.style.display = 'none';

    const row = document.createElement('div');
    row.className = 'message-row-ai';
    row.innerHTML = `
      <div class="ai-avatar-badge">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z"/></svg>
      </div>
      <div class="ai-card">
        <div class="ai-content stream-content"></div>
        ${responseData.image ? `
          <div class="generated-image-card" style="display:none;">
            <img src="${responseData.image}" alt="Generated AI Visual" />
            <div class="image-card-caption">✨ Generated by Luma Vision 2.0</div>
          </div>
        ` : ''}
        <div class="ai-card-actions" style="opacity: 0;">
          <button class="card-action-btn copy-msg-btn" title="Copy response">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
          </button>
          <button class="card-action-btn reaction-btn" title="Helpful response">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
          </button>
          <button class="card-action-btn reaction-btn" title="Improve response">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
          </button>
        </div>
      </div>
    `;
    messagesContainer.appendChild(row);

    const streamEl = row.querySelector('.stream-content');
    const actionsEl = row.querySelector('.ai-card-actions');
    const imgCard = row.querySelector('.generated-image-card');

    // Streaming character/token simulation
    if (state.preferences.stream) {
      let currentIdx = 0;
      const fullText = responseData.text;
      const step = 8; // speed of streaming
      const interval = setInterval(() => {
        currentIdx += step;
        if (currentIdx >= fullText.length) {
          currentIdx = fullText.length;
          clearInterval(interval);
          streamEl.innerHTML = formatMarkdown(fullText);
          actionsEl.style.opacity = '1';
          if (imgCard) imgCard.style.display = 'block';
          state.isGenerating = false;
          
          // Save in memory
          const currentConv = state.conversations.find(c => c.id === state.activeConvId);
          if (currentConv) {
            currentConv.messages.push({
              sender: 'ai',
              text: fullText,
              image: responseData.image,
              timestamp: getCurrentTime()
            });
          }
        } else {
          streamEl.innerHTML = formatMarkdown(fullText.substring(0, currentIdx));
        }
        scrollChatToBottom();
      }, 15);
    } else {
      streamEl.innerHTML = formatMarkdown(responseData.text);
      actionsEl.style.opacity = '1';
      if (imgCard) imgCard.style.display = 'block';
      state.isGenerating = false;
      scrollChatToBottom();
    }

    // Attach copy & reaction handlers
    const copyBtn = row.querySelector('.copy-msg-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(responseData.text);
        showToast('Response copied to clipboard');
      });
    }

    const reactionBtns = row.querySelectorAll('.reaction-btn');
    reactionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        showToast('Feedback submitted');
      });
    });

  }, 650);
}

// Content generator for responses
function generateResponseContent(prompt, category) {
  const lower = prompt.toLowerCase();

  if (category === 'write' || lower.includes('launch email') || lower.includes('write')) {
    return {
      text: `Here is a high-converting launch email draft for your productivity app:\n\n**Subject:** Stop losing 2.5 hours every day to task chaos\n\n**Hi {{FirstName}},**\n\nMost high-performing founders start their day with a clear plan — only to be derailed by 11 AM by sudden firefighting.\n\nWe built **Flowstate** to solve exactly that.\n\n### What makes it different:\n- **Smart Prioritization:** Automatically clusters tasks based on cognitive impact, not just deadlines.\n- **Deep Work Blocks:** Shields your calendar and snoozes distractions dynamically.\n- **Zero Overhead:** Capture tasks in plain natural language.\n\n👉 **[Claim your early access pass here]** — free for the first 500 teams.\n\nBest,\nAlex & the Flowstate Team`,
      image: null
    };
  }

  if (category === 'code' || lower.includes('react') || lower.includes('code') || lower.includes('function')) {
    return {
      text: `### React Server Components (RSC) Explained\n\nIn modern Next.js and React 18+, components are rendered on the server by default. This delivers zero-bundle-size overhead for static content.\n\n\`\`\`jsx\n// 1. Server Component (Direct Database/Fetch access)\nimport db from '@/lib/db';\n\nexport default async function ProductPage({ params }) {\n  const product = await db.products.findById(params.id);\n\n  return (\n    <main className="container">\n      <h1>{product.name}</h1>\n      <p>{product.description}</p>\n      {/* Client Component for interactive parts */}\n      <AddToCartButton productId={product.id} />\n    </main>\n  );\n}\n\`\`\`\n\n### Golden Rule:\n- Use **Server Components** for data fetching, backend secret protection, and static layouts.\n- Use **Client Components** (\`"use client"\`) strictly when you need \`useState\`, \`useEffect\`, browser APIs, or event listeners.`,
      image: null
    };
  }

  if (category === 'image' || lower.includes('image') || lower.includes('workspace') || lower.includes('visual')) {
    return {
      text: `Here is the visual concept generated for a serene minimalist workspace with ambient lighting:\n\n- **Atmosphere:** Warm golden-hour daylight casting soft architectural shadows.\n- **Elements:** Natural walnut timber desk, ultra-slim OLED display, bespoke ceramic mug, and a thriving Monstera plant.\n- **Lighting:** 2700K indirect warm glow creating a calm focus sanctuary.`,
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80'
    };
  }

  return {
    text: `I've analyzed your request with **${state.selectedModel}**.\n\nHere are the recommended next steps:\n\n1. **Core Strategy:** Define the measurable outcome and target audience constraints.\n2. **Iterative Execution:** Break down the solution into high-leverage atomic tasks.\n3. **Feedback Loop:** Test early prototypes with real feedback.\n\nWould you like me to elaborate on any specific phase or generate actionable templates?`,
    image: null
  };
}

// Markdown Formatter (Converts code blocks, bold, headers, blockquotes, lists)
function formatMarkdown(text) {
  if (!text) return '';

  let html = text;

  // Code blocks ```lang ... ```
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'code';
    return `
      <div class="code-block-wrap">
        <div class="code-header">
          <span>${language.toUpperCase()}</span>
          <button class="code-copy-btn" onclick="copyCodeSnippet(this)">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy code
          </button>
        </div>
        <pre><code>${escapeHtml(code.trim())}</code></pre>
      </div>`;
  });

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;color:#0f172a;padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.85em;">$1</code>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size:1.05rem;font-weight:700;margin:12px 0 6px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size:1.15rem;font-weight:700;margin:14px 0 8px;">$1</h2>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid #10b981;padding-left:12px;margin:8px 0;color:#475569;font-style:italic;">$1</blockquote>');

  // Bullet items
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');

  // Wrap loose newlines
  const paragraphs = html.split('\n\n').map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<div') || p.startsWith('<h2') || p.startsWith('<h3') || p.startsWith('<blockquote') || p.startsWith('<li>')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return paragraphs;
}

// Global copy helper for code blocks
window.copyCodeSnippet = function(btn) {
  const codeEl = btn.closest('.code-block-wrap').querySelector('code');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.innerText);
    showToast('Code copied to clipboard');
  }
};

// Adjust textarea auto-expand height
function adjustTextareaHeight() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 160) + 'px';
}

// Scroll chat to bottom
function scrollChatToBottom() {
  if (state.preferences.autoScroll) {
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }
}

// Toast notification helper
function showToast(msg) {
  toastMessage.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}

// Utility: Format current time
function getCurrentTime() {
  const date = new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
}

// Clear attachment preview
function clearAttachmentPreview() {
  state.attachedFile = null;
  attachmentPreviewBar.style.display = 'none';
  if (fileAttachmentInput) fileAttachmentInput.value = '';
}

// Mobile sidebar controls
function openMobileSidebar() {
  sidebar.classList.add('open');
  mobileOverlay.classList.add('active');
}

function closeMobileSidebar() {
  sidebar.classList.remove('open');
  mobileOverlay.classList.remove('active');
}

// Setup Event Listeners
function setupEventListeners() {
  // Input Typing & Enter to send
  messageInput.addEventListener('input', () => {
    adjustTextareaHeight();
    sendBtn.disabled = messageInput.value.trim().length === 0 && !state.attachedFile;
  });

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  sendBtn.addEventListener('click', handleSendMessage);
  newChatBtn.addEventListener('click', createNewChat);

  // Search Filter
  chatSearchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    clearSearchBtn.style.display = val ? 'block' : 'none';
    renderSidebarChats(val);
  });

  clearSearchBtn.addEventListener('click', () => {
    chatSearchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderSidebarChats('');
    chatSearchInput.focus();
  });

  searchFocusBtn.addEventListener('click', () => {
    chatSearchInput.focus();
  });

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for new chat)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      createNewChat();
    }
    if (e.key === 'Escape') {
      modelDropdownWrap.classList.remove('open');
      toolsDropdownWrap.classList.remove('open');
      settingsModal.classList.remove('open');
    }
  });

  // Model Selector Dropdown
  modelSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modelDropdownWrap.classList.toggle('open');
    toolsDropdownWrap.classList.remove('open');
  });

  document.querySelectorAll('.model-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.model-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const modelName = opt.querySelector('.model-opt-title').childNodes[0].textContent.trim();
      selectedModelLabel.textContent = modelName;
      state.selectedModel = modelName;
      modelDropdownWrap.classList.remove('open');
      showToast(`Switched to ${modelName}`);
    });
  });

  // Tools Menu Toggle
  toolsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toolsDropdownWrap.classList.toggle('open');
    modelDropdownWrap.classList.remove('open');
  });

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    if (!modelDropdownWrap.contains(e.target)) {
      modelDropdownWrap.classList.remove('open');
    }
    if (!toolsDropdownWrap.contains(e.target)) {
      toolsDropdownWrap.classList.remove('open');
    }
  });

  // File Upload Handling
  fileAttachmentInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      state.attachedFile = file;
      previewFileName.textContent = file.name;
      attachmentPreviewBar.style.display = 'flex';
      sendBtn.disabled = false;
      showToast(`Attached: ${file.name}`);
    }
  });

  removeFileBtn.addEventListener('click', clearAttachmentPreview);

  // Privacy Mode Toggle
  privacyToggleBtn.addEventListener('click', () => {
    state.isPrivate = !state.isPrivate;
    privacyToggleBtn.style.opacity = state.isPrivate ? '1' : '0.5';
    showToast(state.isPrivate ? 'Private chat enabled' : 'Cloud sync enabled');
  });

  // Export Chat
  exportChatBtn.addEventListener('click', () => {
    const currentConv = state.conversations.find(c => c.id === state.activeConvId);
    if (!currentConv || currentConv.messages.length === 0) {
      showToast('No messages to export');
      return;
    }
    const exportContent = currentConv.messages.map(m => `[${m.sender.toUpperCase()} - ${m.timestamp}]\n${m.text}\n`).join('\n---\n\n');
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConv.title.replace(/\s+/g, '_')}_transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Conversation exported');
  });

  // Settings Modal
  userProfileBtn.addEventListener('click', () => {
    settingsModal.classList.add('open');
  });

  closeSettingsModal.addEventListener('click', () => {
    settingsModal.classList.remove('open');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('open');
    }
  });

  // Mobile drawer events
  sidebarToggleBtn.addEventListener('click', openMobileSidebar);
  mobileCloseBtn.addEventListener('click', closeMobileSidebar);
  mobileOverlay.addEventListener('click', closeMobileSidebar);
}
