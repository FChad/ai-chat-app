# Nuxt Ollama Chat

Eine moderne Chat-Anwendung mit Ollama-Integration, die sowohl normalen Chat als auch KI-zu-KI Gespräche unterstützt.

## Features

- 🤖 **Normaler Chat**: Chatte direkt mit der KI
- 🔄 **KI vs KI**: Lass zwei KI-Modelle miteinander sprechen
- 🎨 **Modernes UI**: Schöne, responsive Benutzeroberfläche mit Tailwind CSS
- 🔒 **Sichere API**: Environment-basierte Konfiguration für API-Credentials
- 📱 **Responsive**: Funktioniert auf Desktop und Mobile
- ⚡ **Streaming**: Echtzeitantworten mit Server-Sent Events

## Setup

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

## Verwendung

### Normaler Chat
- Gehe zu `/` (Hauptseite)
- Schreibe eine Nachricht und drücke Enter oder klicke "Senden"
- Die KI antwortet in Echtzeit mit Streaming

### KI vs KI Chat
- Gehe zu `/ai-chat`
- Gib eine Startnachricht ein (z.B. "Erzählt euch eine Geschichte")
- Stelle die maximale Anzahl von Nachrichten ein
- Klicke "Start" um die Unterhaltung zu beginnen
- Die KIs werden abwechselnd antworten

## Technische Details

### API-Endpunkte
- `POST /api/chat` - Sendet Nachrichten an Ollama und streamt die Antwort

### Sicherheit
- API-Credentials werden nur serverseitig verwendet
- Basic Authentication für Ollama API
- Environment-Variablen sind nicht öffentlich zugänglich

### Architektur
- **Frontend**: Vue 3 + Nuxt 3 + Tailwind CSS
- **Backend**: Nuxt Server API
- **Streaming**: Server-Sent Events für Echtzeitantworten
- **Icons**: Heroicons über @nuxt/icon

## Deployment

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

## Anpassungen

### Andere Ollama-Modelle verwenden

Du kannst das Standard-Modell in `server/api/chat.post.ts` ändern:

```typescript
const { message, model = 'dein-model-name' } = body
```

### UI-Styling anpassen

Die Styles befinden sich in:
- `assets/css/main.css` - Globale Styles
- Komponenten verwenden Tailwind CSS Klassen

### Weitere Features hinzufügen

- Conversation History speichern
- Verschiedene KI-Modelle auswählen
- Chat-Export Funktionalität
- Benutzer-Authentifizierung
