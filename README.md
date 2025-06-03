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
- 🐛 **Bugfix Release**: Resolution of critical errors
- 💬 **Multiple Chats Fix**: Corrected functionality for multiple simultaneous chats
- 📅 **Sorting by Creation Date**: Conversations are now sorted by `created_at`

### v0.1.2-beta
- 📱 **Mobile Enhancements**: Improved mobile user interface and responsiveness
- 🎨 **UI Optimizations**: Enhanced user-friendliness on mobile devices
- 🔧 **Mobile-specific Improvements**: Touch optimization and better navigation

### v0.1.0-beta
- 🚀 **Initial Release**: First beta version of the application
- 🤖 **Basic AI Chat Functionality**: Chat with Ollama models
- 💬 **Session Management**: First implementation of the session system
- 🎨 **Base UI**: Basic user interface with Tailwind CSS

## 🚀 New Features (v0.1.2-beta)

### Session-based Chat Management ⭐ NEW
- **Unique Session IDs**: Each chat receives a UUIDv4 for unique identification
- **Concurrent Chat Support**: Multiple chats can run simultaneously without overlap
- **Response Assignment**: Streaming responses are correctly assigned to the respective chat
- **Session Tracking**: Active sessions are monitored and can be aborted
- **Abort Functionality**: Chat requests can be aborted during streaming

### ChatGPT-like Interface
- **Sidebar with Conversations**: All conversations at a glance
- **Automatic Titles**: Titles are generated from the first message
- **Model Locking**: Model cannot be changed during a conversation
- **Delete Conversation**: Delete individual conversations with confirmation
- **New Conversation**: Easily start new conversations
- **Session Status Display**: Visual display of active chat sessions
- **Cancel Button**: Chat requests can be canceled at any time

### Extended Functions
- **Settings Dialog**: Complete dialog with app information
- **Statistics**: Number of conversations and messages
- **Export/Import**: Export conversations as JSON
- **Local Persistence**: All data is stored in LocalStorage

## 🚀 New Optimizations

### Session Management
- **UUIDv4 Generation**: Unique IDs for each chat request
- **AbortController**: Graceful cancellation of running requests
- **Session Tracking**: Central management of all active chat sessions
- **Response Routing**: Correct assignment of streaming responses
- **Concurrent Safety**: Prevents response mixing with multiple simultaneous chats

### Code Structure
- **Component-based**: Split UI into reusable components
- **Composables**: Logic extracted into reusable composables
- **State Management**: Pinia Store for central state management
- **TypeScript**: Complete typing for better developer experience
- **Session Management**: New interfaces and types for session handling

### Performance
- **Lazy Loading**: Optimized component loading
- **Reactivity**: Improved Vue 3 reactivity
- **Memory Management**: Better memory management
- **Request Optimization**: Optimized request handling with session IDs

### Maintainability
- **Modular Structure**: Clear separation of responsibilities
- **Error Handling**: Robust error handling
- **Code Quality**: Clean, readable code
- **Session Lifecycle**: Clear session lifecycle management

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

### Session Management Architecture
- **UUID Generation**: Crypto-API based UUIDv4 generation with fallback
- **Session Tracking**: Map-based management of active sessions in Pinia Store
- **Request Association**: Each API request contains a unique session ID
- **Response Routing**: Server adds session IDs to streaming responses
- **Abort Handling**: AbortController for graceful request cancellation
- **Concurrent Safety**: Prevents response mixing with parallel chats

### Frontend Architecture
- **Framework**: Vue 3 + Nuxt 3
- **State Management**: Pinia with session tracking
- **Styling**: Tailwind CSS + Typography Plugin
- **Icons**: Heroicons via @nuxt/icon
- **TypeScript**: Complete typing incl. session types

### Backend API
- **Runtime**: Nuxt Server API
- **Streaming**: Server-Sent Events with session ID injection
- **Authentication**: Basic Auth for Ollama
- **Error Handling**: Robust error handling
- **Session Headers**: X-Session-ID header for response tracking

### API Endpoints
- `POST /api/chat` - Sends messages to Ollama and streams the response (with session ID)
- `GET /api/models` - Loads available Ollama models

### Session Management Flow
1. **Request Initiation**: UUIDv4 is generated and session started
2. **API Call**: Request with session ID is sent to backend
3. **Response Processing**: Server adds session ID to all response chunks
4. **Response Routing**: Frontend routes responses based on session ID
5. **Session Cleanup**: Session is ended after completion or abortion

### Security
- API credentials are only used server-side
- Basic Authentication for Ollama API
- Environment variables are not publicly accessible
- XSS protection through HTML escaping
- Session IDs are not persistent and only for request tracking

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
