import { PlayerInfo, SessionInfo } from "./types";
import axios from 'axios'

export default class ArcadeClientSDK {

  sessionToken: string = ""
  url = "https://userapi.ultimatearcade.io"
  gotEndResponse = false

  constructor(options?: {
    baseDomain?: string
  }) {
    // Register listener for iframe messaging
    window.onmessage = (e) => {
      // Only set this once
      if (this.sessionToken === "" && e.data.token) {
        this.sessionToken = e.data.token
      }
      if (e.data.token) {
        // Send back confirmation regardless
        window.top?.postMessage({msg: 'gotToken'}, '*')
      }
      if (e.data.msg && e.data.msg === "gameOver") {
        // The parent window confirming game over received
        this.gotEndResponse = true
      }
    }

    if (options?.baseDomain) {
      this.url = `https://userapi.${options.baseDomain}`
    }
  }

  /**
   * Fetches the information about the game session, most importantly the address of the game server to connect to
   */
  getSessionInfo(): SessionInfo {
    if (this.sessionToken === "") {
      throw new Error("parent page not ready yet, try again in a bit")
    }

    // Decode the JWT
    const decoded = JSON.parse(Buffer.from(this.sessionToken.split(".")[1], "base64").toString())

    return {
      server_address: decoded.addr
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
            'Authorization': `Bearer ${this.sessionToken}`
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
    while (!this.gotEndResponse) {
      window.top?.postMessage({msg: 'gameOver'}, '*')

      // Sleep 50ms before checking again
      await new Promise((r) => {
        setTimeout(() => {
          r(null)
        }, 50)
      })
    }
  }
}
