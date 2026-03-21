export interface IssueJudgment {
  issue: string
  summaryA: string
  summaryB: string
  verdict: 'A' | 'B'
  reason: string
}

export interface Judgment {
  issues: IssueJudgment[]
  resolution: string
  createdAt: string
}
