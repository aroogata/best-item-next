export const DEFAULT_REQUEST_ERROR_MESSAGE = 'リクエストに失敗しました。'
export const DEFAULT_UNEXPECTED_ERROR_MESSAGE = '予期しないエラーが発生しました。'

export function getDraftStatusLabel(status: string) {
  if (status === 'all') return 'すべての状態'
  if (status === 'pending') return '未生成'
  if (status === 'generating') return '生成中'
  if (status === 'done') return '生成完了'
  if (status === 'error') return 'エラー'
  if (status === 'redirect') return 'リダイレクト'
  return status
}
