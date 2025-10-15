export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
} 