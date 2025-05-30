import hljs from 'highlight.js'

export const useHighlight = () => {
  // Configure highlight.js
  const configureHighlight = () => {
    // Configure common languages
    hljs.configure({
      classPrefix: 'hljs-',
      languages: [
        'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
        'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',
        'html', 'css', 'scss', 'sass', 'less',
        'json', 'xml', 'yaml', 'toml',
        'sql', 'bash', 'shell', 'powershell',
        'markdown', 'dockerfile', 'nginx',
        'vue', 'react', 'angular'
      ]
    })
  }

  // Highlight code block with automatic class detection
  const highlightCode = (code: string, language?: string): string => {
    try {
      let result
      
      if (language && hljs.getLanguage(language)) {
        // Use specified language
        result = hljs.highlight(code, { language })
      } else {
        // Auto-detect language
        result = hljs.highlightAuto(code, [
          'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
          'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',
          'html', 'css', 'scss', 'json', 'xml', 'yaml', 'sql', 'bash'
        ])
      }
      
      // Return highlighted code with proper CSS classes
      return result.value
    } catch (error) {
      console.warn('Syntax highlighting failed:', error)
      // Return escaped code if highlighting fails
      return escapeHtml(code)
    }
  }

  // Get detected language from auto-highlighting
  const detectLanguage = (code: string): string => {
    try {
      const result = hljs.highlightAuto(code, [
        'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
        'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',
        'html', 'css', 'scss', 'json', 'xml', 'yaml', 'sql', 'bash'
      ])
      return result.language || 'text'
    } catch (error) {
      return 'text'
    }
  }

  // Escape HTML characters
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Get language name for display
  const getLanguageName = (language: string): string => {
    const languageMap: Record<string, string> = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'py': 'Python',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'csharp': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'ruby': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'rust': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'less': 'Less',
      'json': 'JSON',
      'xml': 'XML',
      'yml': 'YAML',
      'yaml': 'YAML',
      'toml': 'TOML',
      'sql': 'SQL',
      'bash': 'Bash',
      'sh': 'Shell',
      'shell': 'Shell',
      'ps1': 'PowerShell',
      'powershell': 'PowerShell',
      'md': 'Markdown',
      'markdown': 'Markdown',
      'dockerfile': 'Dockerfile',
      'nginx': 'Nginx',
      'vue': 'Vue',
      'jsx': 'React',
      'tsx': 'React',
      'text': 'Text',
      'plaintext': 'Plain Text'
    }
    
    return languageMap[language.toLowerCase()] || language.toUpperCase()
  }

  return {
    configureHighlight,
    highlightCode,
    detectLanguage,
    getLanguageName,
    escapeHtml
  }
} 