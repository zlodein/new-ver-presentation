import { ref, watch } from 'vue'

export function usePhoneMask(initialValue = '') {
  const phone = ref(initialValue)

  const formatPhone = (value: string): string => {
    // Удалить все нецифровые символы
    const digits = value.replace(/\D/g, '')
    
    // Если начинается не с 7 или 8, добавить 7
    let formatted = digits
    if (formatted.length > 0 && formatted[0] !== '7' && formatted[0] !== '8') {
      formatted = '7' + formatted
    }
    
    // Заменить 8 на 7 в начале
    if (formatted[0] === '8') {
      formatted = '7' + formatted.slice(1)
    }
    
    // Ограничить до 11 цифр
    formatted = formatted.slice(0, 11)
    
    // Форматировать: +7 (000) 000-00-00
    if (formatted.length === 0) return ''
    if (formatted.length <= 1) return `+${formatted}`
    if (formatted.length <= 4) return `+${formatted.slice(0, 1)} (${formatted.slice(1)}`
    if (formatted.length <= 7) return `+${formatted.slice(0, 1)} (${formatted.slice(1, 4)}) ${formatted.slice(4)}`
    if (formatted.length <= 9) return `+${formatted.slice(0, 1)} (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7)}`
    return `+${formatted.slice(0, 1)} (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7, 9)}-${formatted.slice(9, 11)}`
  }

  const handleInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    const value = input.value
    const formatted = formatPhone(value)
    phone.value = formatted
    input.value = formatted
  }

  const getCleanPhone = (): string => {
    return phone.value.replace(/\D/g, '')
  }

  return {
    phone,
    handleInput,
    getCleanPhone,
    formatPhone,
  }
}
