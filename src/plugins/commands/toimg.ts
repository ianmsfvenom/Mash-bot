import { downloadMediaMessage, proto } from "@whiskeysockets/baileys"
import { getMessageDetails } from "../../utils/message-utils"
import { socket } from "../../../main"
import pino from "pino"
import { generateFilename } from "../../utils/file-utils"
import * as child from "child_process"
import fs from 'fs'
import { getMediaBuffer } from "../../utils/media-utils"


const handler = async (message: proto.IWebMessageInfo) => {
    const contentMessage = getMessageDetails(message)
    
    const reply = async (msg: string) => {
        socket.sendMessage(contentMessage.from, { text: msg }, { quoted: message })
    }

    if(contentMessage.message_type !== 'extendedTextMessage') return reply('_*❌ Responda uma figurinha para que eu possa converter para imagem... ❌*_')
    if(contentMessage.quoted_message_type !== 'stickerMessage') return reply('_*❌ Responda uma figurinha para que eu possa converter para imagem ❌*_')
    
    const bufferMedia: Buffer = await getMediaBuffer({
        mediaKey: message.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage.mediaKey,
        directPath: message.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage.directPath,
        url: `https://mmg.whatsapp.net${message.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage.directPath}`
    }, 'sticker')
    
    const filenameInput = generateFilename('webp')
    const filenameOutput = generateFilename('png')

    await fs.writeFileSync(`./src/res/${filenameInput}`, bufferMedia)

    child.exec(`ffmpeg -i src/res/${filenameInput} -vf scale=512:512 src/res/${filenameOutput}`, async (err) => {
        if(err) return reply('_*❌ Falha ao converter para imagem ❌*_')
        socket.sendMessage(contentMessage.from, { image: fs.readFileSync(`./src/res/${filenameOutput}`), caption: '*Sucesso! ✅*'})

        const deleteFilesInterval = setInterval(async () => {
            const isOutputExist = fs.existsSync(`./src/res/${filenameOutput}`)
            const isInputExists = fs.existsSync(`./src/res/${filenameInput}`)

            if(isOutputExist) fs.unlinkSync(`./src/res/${filenameOutput}`)
            if(isInputExists) fs.unlinkSync(`./src/res/${filenameInput}`)

            if(!isInputExists && !isOutputExist) clearInterval(deleteFilesInterval)
        }, 500)
    })

}
handler.commands = ['toimg']

export default handler