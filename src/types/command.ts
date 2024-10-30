import { proto } from "@whiskeysockets/baileys"

export type CommandPluginType = {
    (message: proto.IWebMessageInfo): void
    commands: string[]
}