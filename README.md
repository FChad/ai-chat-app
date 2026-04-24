# AskChadAI - AI Chat Application

[![Nuxt](https://img.shields.io/badge/Nuxt-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

A modern AI chat application built with Nuxt and Vue, featuring OpenRouter integration for conversations with 100+ AI models.

## Features

- Multiple AI models via OpenRouter with live browsing
- Conversation management with full context
- Real-time streaming with Server-Sent Events
- Dark/Light mode with system preference detection
- Local storage for all conversations
- Markdown rendering with syntax highlighting
- Export conversations as JSON

## Tech Stack

**Core**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS 4, Nuxt UI 4  
**State**: Pinia  
**Features**: Dark Mode, Markdown (Comark + Shiki)  
**Services**: OpenRouter API

## Getting Started

```bash
git clone https://github.com/FChad/ai-chat-app.git
cd ai-chat-app
npm install
cp env.example .env
npm run dev
```

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run generate  # Generate static site
npm run preview   # Preview production build
```

## Environment Variables

Create a `.env` file with the following:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Get your API key at [OpenRouter.ai](https://openrouter.ai).

## License

All Rights Reserved with Educational Use - See [LICENSE](./LICENSE) for details.

**You can use**: Code as a learning reference for Nuxt, Vue, and OpenRouter integration patterns.  
**You cannot use**: Copy, redistribute, modify, or commercially use any part of this codebase.

Build your own version from scratch using your own code.
