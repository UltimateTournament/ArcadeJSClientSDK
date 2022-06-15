import { PlayerInfo, SessionInfo } from "./types";
import axios from 'axios'

export default class ArcadeClientSDK {

  private readonly gotSession: ((r: string | PromiseLike<string>) => void)
  private readonly sessionToken: Promise<string>
  private url = "https://userapi.ultimatearcade.io"

  constructor(options?: {
    baseDomain?: string
  }) {
    let gs: ((r: string | PromiseLike<string>) => void)
    this.sessionToken = new Promise<string>((resolve)=> gs=resolve)
    this.gotSession = gs!
    // Register listener for iframe messaging
    window.onmessage = (e) => {
      if (e.data.token) {
        this.gotSession(e.data.token)
      }
    }
    window.top?.postMessage({ msg: 'requestToken' }, '*')

    if (options?.baseDomain) {
      this.url = `https://userapi.${options.baseDomain}`
    }
  }

  /**
   * Fetches the information about the game session, most importantly the address of the game server to connect to
   */
  async getSessionInfo(): Promise<SessionInfo> {
    const token = await this.sessionToken
    // Decode the JWT
    const decoded = JSON.parse(atob(token.split(".")[1]))

    return {
      server_address: decoded.addr,
      player_token: token,
    }
  }

  /**
   * Fetches profile information about the player, like their display name
   */
  async getPlayerProfile(): Promise<PlayerInfo> {
    try {
      let statuscode = 0
      let retryCount = 0
      let data: PlayerInfo | null = null
      while (statuscode !== 200) {
        if (retryCount > 0) {
          await new Promise((r) => {
            setTimeout(() => {
              r(null)
            }, 200 * retryCount)
          })
        }
        const res = await axios.post(this.url+'/games/player-profile', {}, {
          headers: {
            'Authorization': `Bearer ${await this.sessionToken}`
          }
        })
        statuscode = res.status
        if (statuscode > 299 && statuscode < 500) {
          throw new Error(`server returned ${statuscode} - ${res.statusText}`)
        }

        if (statuscode <= 299) {
          data = res.data
        }

        retryCount++
        if (retryCount >= 5) {
          throw new Error(`max retries hit, exiting with status code ${statuscode}`)
        }
      }
      return data as PlayerInfo
    } catch (error) {
      throw error
    }
  }

  /**
   * Tells the Ultimate Arcade parent window that the game session has ended, and the game client can be removed from the page and the results shown.
   */
  async gameOver(): Promise<void> {
    window.top?.postMessage({ msg: 'gameOver', token: await this.sessionToken }, '*')
  }
}