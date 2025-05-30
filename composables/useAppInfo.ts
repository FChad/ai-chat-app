export const useAppInfo = () => {
  // In a real app, you could read this from package.json or environment variables
  const getVersion = () => {
    // For now, we'll use a static version, but this could be injected at build time
    return '0.1.0-beta'
  }

  const getAppName = () => {
    return 'AskChadAI'
  }

  const getBuildInfo = () => {
    return {
      name: getAppName(),
      version: getVersion(),
      buildDate: new Date().toISOString().split('T')[0], // Current date as fallback
      framework: 'Nuxt 3',
      storage: 'LocalStorage'
    }
  }

  return {
    getVersion,
    getAppName,
    getBuildInfo
  }
} 