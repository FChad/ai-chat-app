# AskChadAI - AI Chat Application

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.3.0-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.5.27-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

Modern AI chat application with OpenRouter integration for conversations with 100+ AI models.

## ✨ Features

- **Multiple AI Models**: Access 100+ models via OpenRouter with live browsing
- **Conversation Management**: Create, rename, and delete conversations with full context
- **Real-time Streaming**: Instant AI responses with Server-Sent Events
- **Dark/Light Mode**: Theme switching with system preference detection
- **Local Storage**: All conversations saved in browser
- **Markdown & Code**: Syntax highlighting with highlight.js
- **Export**: Save conversations as JSON
- **Type Safety**: Full TypeScript support

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Nuxt, Vue |
| **Language** | TypeScript |
| **Styling** | TailwindCSS, @nuxtjs/color-mode |
| **State** | Pinia, @pinia/nuxt |
| **Icons** | @nuxt/icon, @iconify-json/heroicons |
| **Markdown** | marked, highlight.js |
| **AI** | OpenRouter API |

## 📦 Installation

```bash
git clone https://github.com/FChad/ai-chat-app.git
cd ai-chat-app
npm install
cp env.example .env  # Configure environment variables
npm run dev  # Runs on http://localhost:3000
```

## 🚀 Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run generate  # Static site generation
npm run preview   # Preview production build
```

## 🔑 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key for accessing AI models | Yes | `sk-or-v1-...` |

**Getting your API key:**
1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Generate an API key in your dashboard
4. Add it to your `.env` file

## 📝 License

This project is licensed under **All Rights Reserved with Educational Use**.

### ✅ What You Can Do

- **Learning**: Study the code structure and implementation techniques
- **Inspiration**: Get ideas for building your own AI chat application
- **Reference**: Use as a reference for Nuxt 4, Vue 3, and OpenRouter integration patterns

### ❌ What You Cannot Do

- **Copy Code**: Do not copy or reuse any part of this codebase
- **Redistribute**: Do not redistribute this code in any form
- **Derivative Works**: Do not create modified versions or derivative projects
- **Commercial Use**: Do not use this code for commercial purposes
- **Fork and Modify**: Do not fork this repository and publish modifications

### 💡 How to Use This Repository

1. Study the code to understand the implementation
2. Learn from the patterns and architecture
3. **Build your own version from scratch** using your own code
4. Create your own unique features and design

**Important**: This repository is for educational purposes only. If you want to build a similar AI chat application, write your own code!

See the [LICENSE](./LICENSE) file for full details.

<div align="center">
  Made with ❤️
</div>
