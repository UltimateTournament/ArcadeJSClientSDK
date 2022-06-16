# ArcadeJSClientSDK

## Docs

Visit [docs.ultimatearcade.io](https://docs.ultimatearcade.io) for docs

## Mock Mode

This SDK automatically runs in "mock mode" when it detects your game is accessed via localhost. 
This means you can always use this SDK without writing custom code for testing locally.

In mock mode a random but stable token is returned. If you need to overwrite the server address
(it defaults to the localhost), then you have to do this yourself
