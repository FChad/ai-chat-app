# AskChadAI - AI Chat Application

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.2.0-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.5.22-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

Modern AI chat application with OpenRouter integration for seamless conversations with multiple AI models.

## ✨ Features

- **Multiple AI Models**: Access various AI models via OpenRouter integration
- **Conversation Management**: Multiple conversations with context preservation
- **Real-time Streaming**: Server-Sent Events for instant AI responses
- **Dark/Light Mode**: Theme switching with system preference detection
- **Local Storage**: Persistent conversations stored in browser
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript support throughout
- **Session Management**: UUIDv4-based unique session IDs
- **Export Functionality**: Save conversations as JSON
- **Free Models**: Cost-effective operation with free OpenRouter models

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Nuxt 4.2.0, Vue 3.5.22 |
| **Language** | TypeScript 5.7.2 |
| **Styling** | TailwindCSS 3.4.17, @nuxtjs/color-mode |
| **State Management** | Pinia 3.0.3, @pinia/nuxt 0.11.2 |
| **Icons** | @nuxt/icon 2.1.0 |
| **Markdown** | marked 16.4.1, highlight.js 11.11.1 |
| **AI Integration** | OpenRouter API |

## 📦 Installation

```bash
git clone https://github.com/FChad/ai-chat-app.git
cd ai-chat-app
npm install
cp env.example .env  # Configure environment variables
npm run dev  # Runs on http://localhost:3000
```

## � Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run generate  # Static site generation
npm run preview   # Preview production build
```

## � Environment Variables

| Variable | Description | Required | Default/Example |
|----------|-------------|----------|-----------------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI model access | Yes | `sk_or_v1_...` |

**Getting your API key:**
1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Generate an API key in your dashboard
4. The free tier includes access to several high-quality models

## 📁 Project Structure

```
app/
├── components/
│   ├── ChatInput.vue              # Message input with session control
│   ├── ChatMessage.vue            # Individual message rendering
│   ├── ChatMessages.vue           # Message list display
│   ├── ConversationSidebar.vue    # Conversation management
│   ├── ModelSelectionDialog.vue   # AI model selector
│   ├── SettingsDialog.vue         # App settings
│   └── ThemeToggle.vue            # Dark/light mode toggle
├── composables/
│   ├── useChat.ts                 # Chat logic with session management
│   ├── useScrolling.ts            # Auto-scroll functionality
│   └── useHighlight.ts            # Code syntax highlighting
├── stores/
│   └── chat.ts                    # Pinia store for chat state
├── utils/
│   └── uuid.ts                    # UUIDv4 generation
└── pages/
    └── index.vue                  # Main chat interface
server/
└── api/
    ├── chat.post.ts               # Chat API with OpenRouter
    └── models.get.ts              # Available models endpoint
types/
└── chat.ts                        # TypeScript interfaces
```

## 🤖 Available Models

The application includes free OpenRouter models:
- **Meta Llama 3.3 70B Instruct** - Most powerful, best quality
- **Meta Llama 3.3 8B Instruct** - Faster, balanced performance

Add more models in `server/api/models.get.ts`.

## 🎨 Customization

**Styling**: 
- Global styles: `app/assets/css/tailwind.css`
- Component styling: Tailwind CSS utility classes
- Theme configuration: `tailwind.config.js`

**AI Models**: 
- Modify model list in `server/api/models.get.ts`
- Configure default model in chat store

## 📝 License

MIT License

<div align="center">
  Made with ❤️ using Nuxt 4, Vue 3, and TypeScript
</div>
