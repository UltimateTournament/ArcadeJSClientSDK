import { PlayerInfo, SessionInfo } from "./types";
import axios from 'axios'

export default class ArcadeClientSDK {

  sessionToken: string = ""
  url = "https://userapi.ultimatearcade.io"

  constructor(options?: {
    baseDomain?: string
  }) {
    // Register listener for iframe messaging
    window.onmessage = (e) => {
      // Only get this once
      if (this.sessionToken === "") {
        this.sessionToken = e.data
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
}