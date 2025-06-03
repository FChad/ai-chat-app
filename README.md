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

## 📝 Version History

### v0.1.2-beta (Current)
- 🐛 **Bugfix Release**: Resolution of critical Vue reactivity warnings and store issues
- 💬 **Multiple Chats Fix**: Corrected functionality for multiple simultaneous chats
- 📅 **Sorting by Creation Date**: Conversations are now sorted by `created_at`
- ⚙️ **Streaming Mode Toggle**: Added Settings dialog with streaming on/off control
- 🎯 **Smart Typing Indicators**: Real-time "antwortet" status in sidebar conversation cards
- 🗑️ **Legacy Code Removal**: Completely removed deprecated context-based system
- 🎨 **Enhanced Sidebar**: Wider sidebar (320px) with improved conversation card layout
- 🔄 **Dynamic Status Display**: Timestamps replaced with typing indicators during AI responses
- 🚫 **Smart Controls**: Delete buttons disabled during active AI responses
- 📱 **Responsive Improvements**: Better mobile sidebar transitions and touch optimization
- 🎭 **Beautiful Animations**: Smooth typing dots with staggered timing and fade-in effects
- ⚡ **Performance Optimization**: Removed readonly() wrappers for better reactivity
- 🎛️ **Clean Settings UI**: Simplified toggle design without redundant status text

### v0.1.1-beta
- 📱 **Mobile Enhancements**: Improved mobile user interface and responsiveness
- 🎨 **UI Optimizations**: Enhanced user-friendliness on mobile devices
- 🔧 **Mobile-specific Improvements**: Touch optimization and better navigation

### v0.1.0-beta
- 🚀 **Initial Release**: First beta version of the application
- 🤖 **Basic AI Chat Functionality**: Chat with Ollama models
- 💬 **Session Management**: First implementation of the session system
- 🎨 **Base UI**: Basic user interface with Tailwind CSS

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

## 💻 Usage

### Chat with Session Management
- Go to `/` (main page)
- Select an AI model from the dropdown list
- Write a message and press Enter or click "Send"
- The AI responds in real-time with streaming
- Context is automatically maintained between messages
- **Multiple chats simultaneously**: Open multiple tabs or start parallel chats - they don't overlap
- **Cancel chat**: Use the "Cancel" button to stop running requests
- **Session status**: See the active status of your chat session in the UI

### Session Features
- **Unique IDs**: Each chat automatically receives a unique session ID
- **Parallel Chats**: Multiple chats can run simultaneously without interference
- **Request Abortion**: Running chat requests can be aborted at any time
- **Visual Feedback**: Active sessions are displayed in the UI

### Markdown Support
- **Bold**: `**Text**` or `__Text__`
- **Lists**: `- Item` or `1. Item`
- **Code**: `` `code` `` or ``` ```code``` ```
- **Links**: `[Text](URL)`
- **Headings**: `# H1`, `## H2`, etc.

## 🔧 Technical Details

### Modern Chat API Implementation
- **Current API**: Uses modern `/api/chat` endpoint with messages array
- **Conversation State**: Context is maintained through the complete message history
- **No Legacy Code**: All deprecated context-based code has been removed
- **Optimal Performance**: Direct messages array approach without context overhead

### Session Management Architecture
- **UUID Generation**: Crypto-API based UUIDv4 generation with fallback
- **Session Tracking**: Map-based management of active sessions in Pinia Store
- **Request Association**: Each API request contains a unique session ID for tracking
- **Abort Control**: Full request cancellation support with AbortController

### Key Features
- **Real-time Streaming**: Server-Sent Events with session correlation
- **Modern TypeScript**: Fully typed with comprehensive interfaces
- **Responsive Design**: Mobile-first approach with touch-optimized interactions
- **State Persistence**: LocalStorage integration for conversation history and settings
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Smart UI Indicators**: Live typing status with animated dots in conversation sidebar
- **Advanced Settings**: German-localized settings with streaming mode control
- **Session-Aware UI**: Context-sensitive controls that adapt to conversation state
- **Clean Architecture**: Completely modernized codebase without legacy context system

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

### Extending Session Management

The session system can be extended:
- **Session Persistence**: Store sessions in LocalStorage
- **Session Analytics**: Tracking of session metrics
- **Session Limits**: Maximum number of parallel sessions
- **Session Recovery**: Recovery of interrupted sessions

### Adding New Features

Thanks to the modular architecture, new features can be easily added:

- **Conversation History**: Extend the Pinia Store
- **Chat Export**: New composable for export functionality
- **User Authentication**: New auth composable
- **File Upload**: Extend ChatInput component
- **Session Analytics**: Session tracking and metrics

## 🤝 Development

### Code Style
- Use TypeScript for all new files
- Follow the Vue 3 Composition API
- Use Pinia for state management
- Create composables for reusable logic
- Implement session management for new features

### Session Development Guidelines
- Every new chat request should receive a session ID
- Use AbortController for cancellable requests
- Use session IDs for response routing
- Implement proper session cleanup
- Test concurrent chat scenarios

### Testing
```bash
# Linting
npm run lint

# Type checking
npm run type-check
```
