import { PlayerInfo, SessionInfo } from "./types";
import axios from 'axios'

export interface ArcadeClientSDK {
  /**
   * Fetches the information about the game session, most importantly the address of the game server to connect to
   */
  getSessionInfo(): Promise<SessionInfo>

  /**
   * Fetches profile information about the player, like their display name
   */
  getPlayerProfile(): Promise<PlayerInfo>
  /**
   * Tells the Ultimate Arcade parent window that the game session has ended, and the game client can be removed from the page and the results shown.
   */
  gameOver(): Promise<void>
  /**
   * Tells the Ultimate Arcade parent window that the game session cannot continue, and the game client can be removed from the page.
   * 
   * If a player has already joined a game, this method will not release them, but it gives a better experience to players
   * when the game encounters unresolvable errors like permanent network connection loss.
   */
  reportErrorAndClose(reason: string): Promise<void>
}

function newPromise<T>() {
  let handler: ((r: T | PromiseLike<T>) => void)
  let prom = new Promise<T>((resolve) => handler = resolve)
  return { prom, resolve: handler! }
}

export class arcadeClientSDK {

  private readonly sessionToken = newPromise<string>()
  private url = "https://userapi.ultimatearcade.io"

  constructor(options?: {
    baseDomain?: string
  }) {
    // Register listener for iframe messaging
    window.onmessage = (e) => {
      if (e.data.token) {
        this.sessionToken.resolve(e.data.token)
      }
    }
    window.top?.postMessage({ msg: 'requestToken' }, '*')

    if (options?.baseDomain) {
      this.url = `https://userapi.${options.baseDomain}`
    }
  }

  async getSessionInfo(): Promise<SessionInfo> {
    const token = await this.sessionToken
    // Decode the JWT
    const decoded = JSON.parse(atob(token.split(".")[1]))

    return {
      server_address: decoded.addr,
      player_token: token,
    }
  }

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
        const res = await axios.get(this.url + '/games/player-profile', {
          headers: {
            'Authorization': `Bearer ${await this.sessionToken.prom}`
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

  async gameOver(): Promise<void> {
    window.top?.postMessage({ msg: 'gameOver', token: await this.sessionToken.prom }, '*')
  }

  async reportErrorAndClose(reason: string): Promise<void> {
    window.top?.postMessage({ msg: 'gameError', reason, token: await this.sessionToken.prom }, '*')
  }
}
