# AskChadAI

A modern, optimized chat application with Ollama integration for direct chat with AI models.

## ✨ Features

- 🤖 **AI Chat**: Chat directly with various AI models
- 💬 **Conversation Management**: Multiple conversations like ChatGPT
- 🔄 **Model Selection**: Choose between available Ollama models
- 🧠 **Context Preservation**: Conversations maintain their context
- 💾 **Local Storage**: Conversations are stored in the browser
- 🎨 **Modern UI**: Beautiful, responsive user interface with Tailwind CSS
- 🔒 **Secure API**: Environment-based configuration for API credentials
- 📱 **Responsive**: Works perfectly on desktop and mobile
- ⚡ **Streaming**: Real-time responses with Server-Sent Events
- 🏗️ **Optimized Architecture**: Clean code structure with Composables and Pinia
- 📤 **Export Function**: Export your conversations as JSON
- ⚙️ **Settings**: Comprehensive settings and app information
- 🆔 **Session Management**: UUIDv4-based session IDs for unique chat assignment
0.1.0-beta
## 📁 Project Structure

```
├── components/
│   ├── ChatHeader.vue      # Model selection and control
│   ├── ChatMessages.vue    # Message display
│   ├── ChatInput.vue       # Input area with session control
│   └── ChatMessage.vue     # Individual message
├── composables/
│   ├── useChat.ts          # Chat logic with session management
│   └── useScrolling.ts     # Scroll management
├── stores/
│   └── chat.ts             # Pinia Store for chat state and sessions
├── types/
│   └── chat.ts             # TypeScript interfaces incl. session types
├── utils/
│   ├── formatters.ts       # Utility functions
│   └── uuid.ts             # UUIDv4 generation
├── server/api/
│   ├── chat.post.ts        # Chat API endpoint with session support
│   └── models.get.ts       # Models API endpoint
└── pages/
    └── index.vue           # Main page
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
OLLAMA_API_URL=https://server.chad.lu/api
OLLAMA_API_USER=apiuser
OLLAMA_API_KEY=your_api_key_here
```

**Important**: Replace `your_api_key_here` with your actual API key.

### 3. Start Development Server

```bash
npm run dev
```

The application will then be available at `http://localhost:3000`.

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Environment Variables for Production

Make sure the following environment variables are set in your production environment:

- `OLLAMA_API_URL`
- `OLLAMA_API_USER` 
- `OLLAMA_API_KEY`

## 🎨 Customizations

### Using Other Ollama Models

Available models are automatically loaded from the Ollama API. You can change the default model in `stores/chat.ts`.

### Customizing UI Styling

Styles are located in:
- `assets/css/main.css` - Global styles
- Components use Tailwind CSS classes
- `components/ChatMessage.vue` - Markdown styling

### Testing
```bash
# Linting
npm run lint

# Type checking
npm run type-check
```
