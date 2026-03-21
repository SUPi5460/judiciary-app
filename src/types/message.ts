import { Speaker } from './session'

export interface Message {
  id: string
  speaker: Speaker | 'AI'
  content: string
  timestamp: string
}
