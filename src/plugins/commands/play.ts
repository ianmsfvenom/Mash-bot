import { proto } from "@whiskeysockets/baileys"
import { getMessageDetails } from "../../utils/message-utils"
import { socket } from "../../../main"
import { convertWebmToMp3, createYtInfoMessage, durationToSeconds, findBestAudio, getBufferThumb, getBufferUrlDownload, getDownloadYoutube, searchYoutube, writeMetadataAudio, youtubeUrlRegex } from "../../utils/youtube-utils"

const handler = async (message: proto.IWebMessageInfo) => {
    const contentMessage = getMessageDetails(message)
    
    const reply = async (msg: string) => {
        socket.sendMessage(contentMessage.from, { text: msg }, { quoted: message })
    }
   
    if(contentMessage.args.length < 1) return reply('_*❌ Diga o que deseja pesquisar no youtube ❌*_')

    const queryYt = contentMessage.body
    try {
        reply('_*😙 Procurando, aguarde...*_')
        const srcYoutube = (await searchYoutube(queryYt))[0]

        const secondsDuration = durationToSeconds(srcYoutube.duration)
        if(secondsDuration > 600) return reply('_*⚠️ É permitido somente vídeos com menos de 10 minutos ⚠️*_')

        const getDownloadInfo = await getDownloadYoutube(srcYoutube.videoId)
        const bestAudioWebm = await findBestAudio(getDownloadInfo)
        const bufferAudioWebm = await getBufferUrlDownload(bestAudioWebm.dl_link)
        const bufferAudioMp3 = await convertWebmToMp3(bufferAudioWebm)
        const bufferAudioMetadata = await writeMetadataAudio(getDownloadInfo, bufferAudioMp3)

        await socket.sendMessage(contentMessage.from, { 
            image: await getBufferThumb(srcYoutube.videoId),
            caption: createYtInfoMessage(srcYoutube)
        })
        socket.sendMessage(contentMessage.from, {
            audio: bufferAudioMetadata,
            mimetype: 'audio/mpeg'
        })
    } catch(e) {
        reply('_*❌ Falha ao baixar video do youtube ❌*_')
    }
}
handler.commands = [ 'p', 'play' ]

export default handler