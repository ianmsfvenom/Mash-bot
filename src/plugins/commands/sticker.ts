import { downloadMediaMessage, proto } from "@whiskeysockets/baileys"
import { getMessageDetails } from "../../utils/message-utils"
import { socket } from "../../../main"
import pino from "pino"
import mime from 'mime'
import * as child from "child_process"
import { generateFilename } from "../../utils/file-utils"
import fs from 'fs'

const deleteStickerFiles = (inputFileName: string, outputFileName: string) => {
    const isOutputExist = fs.existsSync(`./src/res/${outputFileName}`)
    const isInputExists = fs.existsSync(`./src/res/${inputFileName}`)

    if(isOutputExist) fs.unlinkSync(`./src/res/${outputFileName}`)
    if(isInputExists) fs.unlinkSync(`./src/res/${inputFileName}`)
}

const handler = async (message: proto.IWebMessageInfo) => {
    const contentMessage = getMessageDetails(message)
    
    const reply = async (msg: string) => {
        socket.sendMessage(contentMessage.from, { text: msg }, { quoted: message })
    }
    
    if(contentMessage.message_type !== 'imageMessage' 
    && contentMessage.message_type !== 'videoMessage' 
    && contentMessage.message_type !== 'extendedTextMessage') return reply('_*❌ Sem mídia! Envie uma imagem/vídeo com o comando na legenda ou responda tais... ❌*_')

    if(contentMessage.message_type === 'extendedTextMessage' 
    && (contentMessage.quoted_message_type !== 'imageMessage' 
    && contentMessage.quoted_message_type !== 'videoMessage')) return reply('_*❌ Sem mídia! Envie uma imagem/vídeo com o comando na legenda ou responda tais... ❌*_')

    socket.sendMessage(contentMessage.from, { text: '_*⏳ Convertendo para figurinha, aguarde... ⏳*_'})
    
    const mediaMessage = message
    if(contentMessage.message_type == 'extendedTextMessage') 
        mediaMessage.message = mediaMessage.message.extendedTextMessage.contextInfo.quotedMessage

    const bufferMedia: Buffer = await downloadMediaMessage(mediaMessage, 'buffer', {}, { reuploadRequest: socket.updateMediaMessage, logger: pino({ level: 'silent'}) }) as Buffer
    var filenameInput: string

    if(contentMessage.message_type == 'extendedTextMessage') {
        filenameInput = contentMessage.quoted_message_type == 'videoMessage' ? 
            generateFilename(mime.getExtension(mediaMessage.message.videoMessage.mimetype)) :
            generateFilename(mime.getExtension(mediaMessage.message.imageMessage.mimetype))
    } else {
        filenameInput = contentMessage.message_type == 'videoMessage' ? 
            generateFilename(mime.getExtension(mediaMessage.message.videoMessage.mimetype)) :
            generateFilename(mime.getExtension(mediaMessage.message.imageMessage.mimetype))
    }

    const filenameOutput: string = generateFilename('webp')

    await fs.writeFileSync(`./src/res/${filenameInput}`, bufferMedia)

    const convertCommand: string = contentMessage.quoted_message_type == 'videoMessage' ?
    `ffmpeg -i src/res/${filenameInput} -y -vcodec libwebp -fs 0.99M -filter_complex "[0:v] scale=512:512,fps=12,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse" -f webp src/res/${filenameOutput}` :
    `ffmpeg -i src/res/${filenameInput} -vf scale=512:512 -f webp src/res/${filenameOutput}`
    
    child.exec(convertCommand, async (err) => {
        if(err) {
            reply('_*❌ Não consegui converter para sticker :/ ❌*_')
            deleteStickerFiles(filenameInput, filenameOutput)
            return
        }

        const bufferOutput: Buffer = await fs.readFileSync(`./src/res/${filenameOutput}`)
        await socket.sendMessage(contentMessage.from, { sticker: bufferOutput })

        const deleteFilesInterval = setInterval(async () => {
            deleteStickerFiles(filenameInput, filenameOutput)
            
            const isOutputExist = fs.existsSync(`./src/res/${filenameOutput}`)
            const isInputExists = fs.existsSync(`./src/res/${filenameInput}`)

            if(!isInputExists && !isOutputExist) clearInterval(deleteFilesInterval)
        }, 500)

    })
}
handler.commands = [ 's', 'sticker' ]

export default handler