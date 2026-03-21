type ValidationResult = { valid: true } | { valid: false; error: string }

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim()
  if (!trimmed) return { valid: false, error: '名前を入力してください' }
  if (trimmed.length > 20) return { valid: false, error: '名前は20文字以内で入力してください' }
  return { valid: true }
}

export function validateMessage(message: string): ValidationResult {
  const trimmed = message.trim()
  if (!trimmed) return { valid: false, error: 'メッセージを入力してください' }
  if (trimmed.length > 2000) return { valid: false, error: 'メッセージは2000文字以内で入力してください' }
  return { valid: true }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}
