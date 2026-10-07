# Luma AI — Next.js 14 Full-Stack AI Chatbot

A production-ready, full-stack AI Chatbot application built with **Next.js 14 App Router**, **Google OAuth 2.0 via NextAuth.js**, **MongoDB / Mongoose**, and **OpenAI GPT-4o Streaming**, styled precisely to the Figma UI design.

---

## 🌟 Key Features

1. **Figma High-Fidelity UI**:
   - Dark navy sidebar (`#0f172a`) with custom scrollbars, active indicators, and fast search filter.
   - Clean main chat canvas with dynamic time-based greeting (*"Good morning / afternoon / evening"*).
   - 3 interactive suggestion prompt cards (*"Help me write"*, *"Explain code"*, *"Create an image"*).
   - Floating rounded message composer with auto-expanding textarea, file attachment preview chip, and capabilities popover.

2. **Google OAuth & User Sessions**:
   - NextAuth.js Google Provider for seamless 1-click authentication.
   - Automatic user profile sync into MongoDB `User` collection.
   - User avatar & name integration in the sidebar footer and welcome hero.
   - Guest / Demo fallback provider for immediate local testing.

3. **Per-User Chat History in MongoDB**:
   - Conversations and messages are saved directly under the authenticated user's ID.
   - Persistent chat switching, message history retrieval, and conversation deletion.
   - Automatic title generation from the initial prompt.

4. **Real-time OpenAI GPT-4o Streaming**:
   - Server-Sent Events (SSE) streaming with Next.js App Router edge/node streams.
   - Model switching dropdown: **GPT-4o Mini** (fast) and **GPT-4o** (deep reasoning).
   - Rich Markdown formatting with syntax-highlighted code blocks, copy buttons, and reaction thumbs.
   - Fallback simulated streaming for instant development testing before API keys are added.

5. **Attachment & Export Capabilities**:
   - File attachment picker with preview badge.
   - 1-click Markdown export of conversation transcripts.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration keys in `.env.local`:
```env
# MongoDB Connection URI (Local or MongoDB Atlas)
MONGODB_URI=mongodb://localhost:27017/luma_ai

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

### 3. Run the Development Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Setting Up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and configure the **OAuth consent screen**.
3. Under **Credentials**, create an **OAuth 2.0 Client ID**:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
4. Copy the **Client ID** and **Client Secret** into your `.env.local`.

---

## 🗄️ Database Schema Structure

- **`User`** (`models/User.js`):
  - `email`, `name`, `image`, `googleId`, `createdAt`, `lastLoginAt`
- **`Conversation`** (`models/Conversation.js`):
  - `userId`, `title`, `isPinned`, `createdAt`, `updatedAt`
- **`Message`** (`models/Message.js`):
  - `conversationId`, `userId`, `role` ('user'|'assistant'), `content`, `model`, `attachment`, `createdAt`

---

## 📁 Project Directory Layout

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js   # NextAuth Google OAuth Handler
│   │   ├── chat/route.js                 # OpenAI GPT-4o Streaming Endpoint
│   │   └── conversations/                # MongoDB Conversation CRUD Routes
│   │       ├── route.js                  # List & Create Conversations
│   │       └── [id]/route.js             # Fetch & Delete Conversation
│   ├── components/
│   │   └── AuthProvider.js               # NextAuth SessionProvider Wrapper
│   ├── globals.css                       # Figma High-Fidelity Design System
│   ├── layout.js                         # Root App Layout
│   └── page.js                           # Main Interactive Luma AI Chat App
├── lib/
│   ├── auth.js                           # NextAuth Configuration & Google Provider
│   └── mongodb.js                        # Cached Mongoose Connection Manager
├── models/
│   ├── Conversation.js                   # Mongoose Conversation Schema
│   ├── Message.js                        # Mongoose Message Schema
│   └── User.js                           # Mongoose User Schema
├── .env.example                          # Environment Variables Template
├── .env.local                            # Local Development Env
├── package.json                          # Dependencies & Scripts
└── README.md                             # Documentation
```
