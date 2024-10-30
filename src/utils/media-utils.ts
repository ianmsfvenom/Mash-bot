import { downloadContentFromMessage, proto } from "@whiskeysockets/baileys"

export const getMediaBuffer = async ({ mediaKey, directPath, url }, MediaType: 'image' | 'video' | 'document' | 'sticker'): Promise<Buffer> => {
    const stream = await downloadContentFromMessage({ mediaKey, directPath, url }, MediaType)
    
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
}