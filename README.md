# AskChadAI

Eine moderne, optimierte Chat-Anwendung mit Ollama-Integration für direkten Chat mit KI-Modellen.

## ✨ Features

- 🤖 **KI-Chat**: Chatte direkt mit verschiedenen KI-Modellen
- 💬 **Unterhaltungs-Management**: Mehrere Unterhaltungen wie bei ChatGPT
- 🔄 **Modell-Auswahl**: Wähle zwischen verfügbaren Ollama-Modellen
- 🧠 **Kontext-Erhaltung**: Unterhaltungen behalten ihren Kontext bei
- 💾 **Lokale Speicherung**: Unterhaltungen werden im Browser gespeichert
- 🎨 **Modernes UI**: Schöne, responsive Benutzeroberfläche mit Tailwind CSS
- 🔒 **Sichere API**: Environment-basierte Konfiguration für API-Credentials
- 📱 **Responsive**: Funktioniert perfekt auf Desktop und Mobile
- ⚡ **Streaming**: Echtzeitantworten mit Server-Sent Events
- 🏗️ **Optimierte Architektur**: Saubere Code-Struktur mit Composables und Pinia
- 📤 **Export-Funktion**: Exportiere deine Unterhaltungen als JSON
- ⚙️ **Einstellungen**: Umfassende Einstellungen und App-Informationen

## 🚀 Neue Features (v0.1.1-beta)

### ChatGPT-ähnliche Oberfläche
- **Sidebar mit Unterhaltungen**: Alle Unterhaltungen auf einen Blick
- **Automatische Titel**: Titel werden aus der ersten Nachricht generiert
- **Modell-Sperrung**: Modell kann während einer Unterhaltung nicht gewechselt werden
- **Unterhaltung löschen**: Einzelne Unterhaltungen mit Bestätigung löschen
- **Neue Unterhaltung**: Einfach neue Unterhaltungen starten

### Erweiterte Funktionen
- **Einstellungen-Dialog**: Vollständiger Dialog mit App-Informationen
- **Statistiken**: Anzahl Unterhaltungen und Nachrichten
- **Export/Import**: Unterhaltungen als JSON exportieren
- **Lokale Persistierung**: Alle Daten werden im LocalStorage gespeichert

## 🚀 Neue Optimierungen

### Code-Struktur
- **Komponenten-basiert**: Aufgeteilte UI in wiederverwendbare Komponenten
- **Composables**: Logik in wiederverwendbare Composables ausgelagert
- **State Management**: Pinia Store für zentrales State Management
- **TypeScript**: Vollständige Typisierung für bessere Entwicklererfahrung

### Performance
- **Lazy Loading**: Optimierte Komponentenladung
- **Reaktivität**: Verbesserte Vue 3 Reaktivität
- **Memory Management**: Bessere Speicherverwaltung

### Wartbarkeit
- **Modularer Aufbau**: Klare Trennung von Verantwortlichkeiten
- **Error Handling**: Robuste Fehlerbehandlung
- **Code Quality**: Sauberer, lesbarer Code

## 📁 Projekt-Struktur

```
├── components/
│   ├── ChatHeader.vue      # Modell-Auswahl und Steuerung
│   ├── ChatMessages.vue    # Nachrichten-Anzeige
│   ├── ChatInput.vue       # Eingabe-Bereich
│   └── ChatMessage.vue     # Einzelne Nachricht
├── composables/
│   ├── useChat.ts          # Chat-Logik
│   └── useScrolling.ts     # Scroll-Management
├── stores/
│   └── chat.ts             # Pinia Store für Chat-State
├── types/
│   └── chat.ts             # TypeScript Interfaces
├── utils/
│   └── formatters.ts       # Utility-Funktionen
├── server/api/
│   ├── chat.post.ts        # Chat API Endpoint
│   └── models.get.ts       # Modelle API Endpoint
└── pages/
    └── index.vue           # Hauptseite
```

## 🛠️ Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Environment-Variablen konfigurieren

Erstelle eine `.env` Datei im Projektroot:

```env
OLLAMA_API_URL=https://server.chad.lu/api
OLLAMA_API_USER=apiuser
OLLAMA_API_KEY=your_api_key_here
```

**Wichtig**: Ersetze `your_api_key_here` mit deinem echten API-Key.

### 3. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## 💻 Verwendung

### Chat
- Gehe zu `/` (Hauptseite)
- Wähle ein KI-Modell aus der Dropdown-Liste
- Schreibe eine Nachricht und drücke Enter oder klicke "Senden"
- Die KI antwortet in Echtzeit mit Streaming
- Der Kontext wird automatisch zwischen den Nachrichten beibehalten
- Nutze "Unterhaltung löschen" um eine neue Unterhaltung zu starten

### Markdown-Support
- **Fett**: `**Text**` oder `__Text__`
- **Listen**: `- Item` oder `1. Item`
- **Code**: `` `code` `` oder ``` ```code``` ```
- **Links**: `[Text](URL)`
- **Überschriften**: `# H1`, `## H2`, etc.

## 🔧 Technische Details

### Frontend-Architektur
- **Framework**: Vue 3 + Nuxt 3
- **State Management**: Pinia
- **Styling**: Tailwind CSS + Typography Plugin
- **Icons**: Heroicons über @nuxt/icon
- **TypeScript**: Vollständige Typisierung

### Backend-API
- **Runtime**: Nuxt Server API
- **Streaming**: Server-Sent Events
- **Authentication**: Basic Auth für Ollama
- **Error Handling**: Robuste Fehlerbehandlung

### API-Endpunkte
- `POST /api/chat` - Sendet Nachrichten an Ollama und streamt die Antwort
- `GET /api/models` - Lädt verfügbare Ollama-Modelle

### Sicherheit
- API-Credentials werden nur serverseitig verwendet
- Basic Authentication für Ollama API
- Environment-Variablen sind nicht öffentlich zugänglich
- XSS-Schutz durch HTML-Escaping

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Environment-Variablen für Production

Stelle sicher, dass die folgenden Environment-Variablen in deiner Production-Umgebung gesetzt sind:

- `OLLAMA_API_URL`
- `OLLAMA_API_USER` 
- `OLLAMA_API_KEY`

## 🎨 Anpassungen

### Andere Ollama-Modelle verwenden

Die verfügbaren Modelle werden automatisch von der Ollama API geladen. Du kannst das Standard-Modell in `stores/chat.ts` ändern.

### UI-Styling anpassen

Die Styles befinden sich in:
- `assets/css/main.css` - Globale Styles
- Komponenten verwenden Tailwind CSS Klassen
- `components/ChatMessage.vue` - Markdown-Styling

### Neue Features hinzufügen

Dank der modularen Architektur können einfach neue Features hinzugefügt werden:

- **Conversation History**: Erweitere den Pinia Store
- **Chat-Export**: Neue Composable für Export-Funktionalität
- **Benutzer-Authentifizierung**: Neue Auth-Composable
- **Datei-Upload**: Erweitere ChatInput Komponente

## 🤝 Entwicklung

### Code-Stil
- Verwende TypeScript für alle neuen Dateien
- Folge der Vue 3 Composition API
- Nutze Pinia für State Management
- Erstelle Composables für wiederverwendbare Logik

### Testing
```bash
# Linting
npm run lint

# Type checking
npm run type-check
```

## 📝 Changelog

### v2.0.0 - Optimierte Architektur
- ✅ Komponenten-basierte Architektur
- ✅ Pinia State Management
- ✅ TypeScript Interfaces
- ✅ Composables für Logik-Trennung
- ✅ Verbesserte Error Handling
- ✅ Performance-Optimierungen
- ✅ Bessere Code-Struktur
