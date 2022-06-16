import { PlayerInfo, SessionInfo } from "./types";

export default class Mock {

  private token: string;

  constructor(options?: {
    baseDomain?: string
  }) {
    const tokenKey = "ua.mock.token"
    let lsToken = window.localStorage.getItem(tokenKey)
    if (!lsToken) {
      lsToken = "token:"+Math.random()
      window.localStorage.setItem(tokenKey, lsToken)
    }
    this.token = lsToken
  }

  async getSessionInfo(): Promise<SessionInfo> {
    return {
      server_address: window.location.host,
      player_token: this.token,
    }
  }

  async getPlayerProfile(): Promise<PlayerInfo> {
    return {
      display_name: "Mock Player - "+this.token,
      tokens: 42,
    }
  }

  async gameOver(): Promise<void> {
    alert("game over! close your tab")
  }
}
