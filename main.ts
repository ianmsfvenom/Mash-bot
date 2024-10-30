import makeWASocket, { Browsers, proto, useMultiFileAuthState, WACallEvent } from "@whiskeysockets/baileys";
import { PrismaClient } from '@prisma/client'
import { sendCallLog, sendConnectionLog } from "./src/utils/log-utils";
import { firstMessageWelcome } from "./src/messages/welcome";
import { firstWelcomeVideoBuffer } from "./src/global/global";
import { getMessageDetails } from "./src/utils/message-utils";
import pino from "pino";
import { loadCommands } from "./src/plugins/handler";
import { clearTempFiles } from "./src/utils/file-utils";

const prisma = new PrismaClient()
export var socket: ReturnType<typeof makeWASocket>


async function main() {
    
    clearTempFiles()

    const { state, saveCreds } = await useMultiFileAuthState('./src/auth')

    socket = await makeWASocket({
        printQRInTerminal: true,
        auth: state,
        browser: Browsers.ubuntu('Desktop'),
        logger: pino({ level: 'silent' })
    })

    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg: proto.IWebMessageInfo = messages[0]

        if(msg.key.fromMe || msg.key.remoteJid == 'status@broadcast') return
        if(!msg.message) return

        const msgDetails = getMessageDetails(msg)
        
        const userExists = await prisma.user.findUnique({ where: { phone_number: msgDetails.sender.split('@')[0] }})
        if(!userExists) {
            await prisma.user.create({ data: { phone_number: msgDetails.sender.split('@')[0], pushname: msgDetails.pushname } })
            socket.sendMessage(msgDetails.from, { caption: firstMessageWelcome, video: firstWelcomeVideoBuffer, gifPlayback: true })
        }
        
        if(!msgDetails.is_cmd) return

        const commandsHandlerArray = await loadCommands()
        for(const handler of commandsHandlerArray) {
            if(handler.commands.find(e => e == msgDetails.cmd)) {
                handler(msg)
                break
            }
        }
    })

    socket.ev.on('connection.update', async ({ connection }) => {
        if(connection == 'connecting') sendConnectionLog(connection, 'Conectando, aguarde...')
        else if(connection == 'close') {
            sendConnectionLog(connection, 'Conexão fechada, tentando reconexão...')
            main()
        }
        else if(connection == 'open') sendConnectionLog(connection, 'Conectado com sucesso!')
    })

    socket.ev.on('call', async (calls: WACallEvent[]) => {
        const call: WACallEvent = calls[0]
        sendCallLog('Ligaçao recebida')
        await socket.sendMessage(call.from, { text: '_*🚫 Como ningém gosta de ligações de estranhos, eu também não gosto, você será bloqueado... 🚫*_'})
        await socket.updateBlockStatus(call.from, 'block')
    })
    socket.ev.on('creds.update', saveCreds)
}

main()