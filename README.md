# AskChadAI

A modern, optimized chat application with OpenRouter integration for direct chat with AI models.

## ✨ Features

- 🤖 **AI Chat**: Chat directly with various AI models via OpenRouter
- 💬 **Conversation Management**: Multiple conversations like ChatGPT
- 🔄 **Model Selection**: Choose between free, fast OpenRouter models
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
- 🆓 **Free Models**: Uses free OpenRouter models for cost-effective operation

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
│   ├── chat.post.ts        # Chat API endpoint with OpenRouter integration
│   └── models.get.ts       # Models API endpoint with free models
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
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Important**: 
- Get your free API key from [OpenRouter.ai](https://openrouter.ai)
- Replace `your_openrouter_api_key_here` with your actual API key
- The free tier includes access to several fast models

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

Make sure the following environment variable is set in your production environment:

- `OPENROUTER_API_KEY`

For cloud deployments (Vercel, Netlify, etc.), configure this in your deployment settings.

## 🎨 Customizations

### Available Free Models

The application includes these free models from OpenRouter:
- **Meta Llama 3.3 70B Instruct** - Most powerful, best quality responses
- **Meta Llama 3.3 8B Instruct** (default) - Faster, good balance of speed and quality

You can add more models in `server/api/models.get.ts`.

### Customizing UI Styling

Styles are located in:
- `app/assets/css/tailwind.css` - Global styles and Tailwind utilities
- Components use Tailwind CSS classes
- `app/components/ChatMessage.vue` - Markdown styling

### Testing
```bash
# Linting
npm run lint

# Type checking
npm run type-check
```

## 🌐 About OpenRouter

OpenRouter provides access to various AI models through a unified API. The free tier includes several high-quality models perfect for testing and development.

- Website: [openrouter.ai](https://openrouter.ai)
- API Docs: [openrouter.ai/docs](https://openrouter.ai/docs)
- Free models: No credit card required for free tier models
