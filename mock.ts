import { ArcadeClientSDK } from "./client";
import { PlayerInfo, SessionInfo } from "./types";

export default class Mock implements ArcadeClientSDK {

  private token: string;

  constructor(options?: {
    baseDomain?: string
  }) {
    console.log("UA SDK running in mock mode")
    const tokenKey = "ua.mock.token"
    let lsToken = window.localStorage.getItem(tokenKey)
    if (!lsToken) {
      lsToken = "token:"+Math.random()
      window.localStorage.setItem(tokenKey, lsToken)
    }
    this.token = lsToken
  }

  storeSettings(settings: Record<string, any>): void {
    window.localStorage.setItem("game-settings", JSON.stringify(settings))
  }

  async getSessionInfo(): Promise<SessionInfo> {
    let settings = JSON.parse(window.localStorage.getItem("game-settings") ?? "{}")
    return {
      server_address: window.location.host,
      player_token: this.token,
      settings,
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

  async reportErrorAndClose(reason: string): Promise<void> {
    alert(`game failed! '${reason}' close your tab`)
  }
}
