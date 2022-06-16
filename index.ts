import ArcadeClientSDK from "./client";
import Mock from "./mock";
import type { PlayerInfo, SessionInfo } from "./types"

const baseDomain = /staging/.test(window.location.hostname) ? "staging.ultimatearcade.io" : undefined;
const sdk = /^localhost|127\.0\.0\.1$/.test(window.location.hostname) ? new Mock() : new ArcadeClientSDK({ baseDomain })
const getSDK = () => sdk

export { getSDK, PlayerInfo, SessionInfo }
