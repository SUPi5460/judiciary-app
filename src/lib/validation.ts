type ValidationResult = { valid: true } | { valid: false; error: string }

const ZERO_WIDTH_CHARS = /[\u200B\u200C\u200D\uFEFF\u00AD]/g

function stripInvisible(str: string): string {
  return str.replace(ZERO_WIDTH_CHARS, '').trim()
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;.*?&gt;/gi, '')
    .replace(ZERO_WIDTH_CHARS, '')
    .trim()
}

export function validateName(name: string): ValidationResult {
  const cleaned = stripInvisible(sanitizeInput(name))
  if (!cleaned) return { valid: false, error: '名前を入力してください' }
  if (cleaned.length > 20) return { valid: false, error: '名前は20文字以内で入力してください' }
  return { valid: true }
}

export function validateMessage(message: string): ValidationResult {
  const cleaned = stripInvisible(sanitizeInput(message))
  if (!cleaned) return { valid: false, error: 'メッセージを入力してください' }
  if (cleaned.length > 2000) return { valid: false, error: 'メッセージは2000文字以内で入力してください' }
  return { valid: true }
}
