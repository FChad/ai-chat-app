#!/usr/bin/env node

/**
 * Produktions-Debugging-Script für die Nuxt Ollama Chat App
 * 
 * Dieses Script hilft dabei, häufige Produktionsprobleme zu identifizieren.
 * Führen Sie es in Ihrer Produktionsumgebung aus, um Konfigurationsprobleme zu finden.
 */

console.log('🔍 Produktions-Debugging für Nuxt Ollama Chat\n')

// 1. Umgebungsvariablen prüfen
console.log('1. 📋 Umgebungsvariablen prüfen:')
const requiredEnvVars = ['OLLAMA_API_URL', 'OLLAMA_API_USER', 'OLLAMA_API_KEY']
let envVarsOk = true

requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`   ✅ ${varName}: ${varName === 'OLLAMA_API_KEY' ? '***masked***' : value}`)
  } else {
    console.log(`   ❌ ${varName}: NICHT GESETZT`)
    envVarsOk = false
  }
})

if (!envVarsOk) {
  console.log('\n⚠️  FEHLER: Nicht alle erforderlichen Umgebungsvariablen sind gesetzt!')
  console.log('   Lösung: Stellen Sie sicher, dass alle drei Variablen in der Produktion konfiguriert sind.')
}

console.log('\n2. 🌐 Ollama API Erreichbarkeit prüfen:')

async function testOllamaAPI() {
  const apiUrl = process.env.OLLAMA_API_URL
  const apiUser = process.env.OLLAMA_API_USER
  const apiKey = process.env.OLLAMA_API_KEY

  if (!apiUrl || !apiUser || !apiKey) {
    console.log('   ⏭️  Überspringe API-Test (Umgebungsvariablen fehlen)')
    return
  }

  try {
    // Test Models Endpoint
    console.log(`   📡 Teste Models Endpoint: ${apiUrl}/models`)
    
    const response = await fetch(`${apiUrl}/models`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiUser}:${apiKey}`).toString('base64')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ Models Endpoint erreichbar (${data.models?.length || 0} Modelle verfügbar)`)
    } else {
      console.log(`   ❌ Models Endpoint Fehler: ${response.status} ${response.statusText}`)
      const errorText = await response.text().catch(() => 'Unbekannter Fehler')
      console.log(`      Details: ${errorText}`)
    }

    // Test Chat Endpoint mit einfacher Nachricht
    console.log(`   📡 Teste Chat Endpoint: ${apiUrl}/chat`)
    
    const chatResponse = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiUser}:${apiKey}`).toString('base64')}`
      },
      body: JSON.stringify({
        model: 'gemma2:2b', // Kleineres Modell für Test
        messages: [{ role: 'user', content: 'Hallo, nur ein Test.' }],
        stream: false
      })
    })

    if (chatResponse.ok) {
      console.log(`   ✅ Chat Endpoint erreichbar`)
      const chatData = await chatResponse.json()
      if (chatData.message?.content) {
        console.log(`   📝 Antwort erhalten: "${chatData.message.content.substring(0, 50)}..."`)
      }
    } else {
      console.log(`   ❌ Chat Endpoint Fehler: ${chatResponse.status} ${chatResponse.statusText}`)
      const errorText = await chatResponse.text().catch(() => 'Unbekannter Fehler')
      console.log(`      Details: ${errorText}`)
    }

  } catch (error) {
    console.log(`   ❌ Netzwerk-Fehler: ${error.message}`)
    console.log('      Mögliche Ursachen:')
    console.log('      - Ollama API ist nicht erreichbar')
    console.log('      - Firewall blockiert ausgehende Verbindungen')
    console.log('      - DNS-Auflösung funktioniert nicht')
  }
}

// 3. Node.js und Nuxt Umgebung prüfen
console.log('\n3. 🔧 Laufzeitumgebung prüfen:')
console.log(`   Node.js Version: ${process.version}`)
console.log(`   Plattform: ${process.platform}`)
console.log(`   Architektur: ${process.arch}`)

// 4. Häufige Produktionsprobleme prüfen
console.log('\n4. 🚨 Häufige Produktionsprobleme prüfen:')

// Check for client-side rendering issues
if (typeof window !== 'undefined') {
  console.log('   ❌ Dieses Script läuft im Browser - sollte nur server-seitig laufen')
} else {
  console.log('   ✅ Läuft korrekt server-seitig')
}

// Check for localhost references in API URLs
if (process.env.OLLAMA_API_URL?.includes('localhost') || process.env.OLLAMA_API_URL?.includes('127.0.0.1')) {
  console.log('   ⚠️  API URL enthält localhost - funktioniert nicht in der Produktion!')
}

console.log('\n5. 💡 Lösungsvorschläge:')
console.log('   📋 Prüfen Sie die Konsole Ihrer Produktionsumgebung auf detaillierte Fehlermeldungen')
console.log('   🌐 Testen Sie die Ollama API direkt mit curl oder Postman')
console.log('   🔧 Stellen Sie sicher, dass alle Umgebungsvariablen korrekt gesetzt sind')
console.log('   📦 Überprüfen Sie, ob alle Dependencies installiert sind')
console.log('   🔄 Versuchen Sie einen neuen Build und Deployment')

// API Test ausführen
await testOllamaAPI()

console.log('\n✅ Debugging abgeschlossen\n') 