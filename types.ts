export interface SessionInfo {
  server_address: string
  player_token: string
  settings: Record<string, any>
}

export interface PlayerInfo {
  display_name: string
  tokens: number
}
