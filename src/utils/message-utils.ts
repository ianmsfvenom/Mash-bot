import { proto } from "@whiskeysockets/baileys";
import { prefix } from "../config/config";
import { MessageDetailsType, ReplyMessageType } from "../types/message";
import { sendMessageLog } from "./log-utils";

export const getBodyMessage = (msg: proto.IMessage): string | null  => {
    const messageType = Object.keys(msg)[0]
    switch(messageType) {
        case 'conversation':
            return msg.conversation
        case 'imageMessage':
            return msg.imageMessage.caption
        case 'documentMessage':
            return msg.documentMessage.caption
        case 'videoMessage':
            return msg.videoMessage.caption
        case 'extendedTextMessage':
            return msg.extendedTextMessage.text
        default: 
            return ''
    }
}

export const getMessageDetails = (msg: proto.IWebMessageInfo): MessageDetailsType => {
    

    const contentMessage = msg.message as proto.IMessage
    const from: string = msg.key.remoteJid as string

    const isGroup: boolean = from.includes('@g.us')
    const messageType: string = Object.keys(contentMessage)[0]
    const sender: string = isGroup ? msg.key.participant : msg.key.remoteJid
    const pushName: string = msg.pushName
    const bodyMsg: string | null = getBodyMessage(contentMessage)
    const isCmd: boolean = bodyMsg.startsWith(prefix)
    const args: string[] = isCmd ? bodyMsg.split(/ +/).slice(1) : []
    const command: string | null = isCmd ? bodyMsg.split(/ +/)[0].slice(1) : null
    const isStatus: boolean = msg.key.remoteJid.includes('status@broadcast')
    const quotedMessageType: string | null = contentMessage?.extendedTextMessage?.contextInfo?.quotedMessage ? Object.keys(contentMessage?.extendedTextMessage?.contextInfo?.quotedMessage)[0] : null


    sendMessageLog(sender, messageType, isCmd)
    
    return {
        from,
        is_group: isGroup,
        message_type: messageType,
        quoted_message_type: quotedMessageType,
        sender: sender,
        pushname: pushName,
        body: bodyMsg,
        is_cmd: isCmd,
        args,
        cmd: command,
        is_status: isStatus,
    }

}
