import fetch from "node-fetch";
import fs from 'fs'
import { exec } from 'child_process'
import NodeID3 from "node-id3";
import { AudioFormatType, DownloadYoutubeInfoType, VideoDetailsType, VideoFormatType } from "../types/youtube";

export const youtubeUrlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export const getDownloadYoutube = async ( videoId = '', client = { clientName: 'ANDROID_MUSIC', clientVersion: '4.32' }, host = 'music.youtube.com' ): Promise<DownloadYoutubeInfoType> => {
  return new Promise(async (resolve, reject) => {
    try {
      var res = await fetch(`https://${host}/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context: {
            client
          },
          videoId
        })
      })
      const resJson = await res.json()
      const videosFormats: VideoFormatType[] = []
      const audioFormats: AudioFormatType[] = []
      if(resJson.playabilityStatus.status != 'OK') {
        setTimeout(async () => {
          if (client.clientName == 'ANDROID_MUSIC') {
            resolve(await getDownloadYoutube(videoId, { clientName: 'ANDROID_EMBEDDED_PLAYER', clientVersion: '16.20' }, 'm.youtube.com'))
          } else if(client.clientName ==  'ANDROID_EMBEDDED_PLAYER') {
            resolve(await getDownloadYoutube(videoId, { clientName: 'ANDROID', clientVersion: '16.20' }, 'm.youtube.com'))
          } else if(client.clientName == 'ANDROID') {
            resolve(await getDownloadYoutube(videoId, { clientName: 'IOS', clientVersion: '17.36.4' }, 'www.youtube.com'))
          } else if(client.clientName == 'IOS') {
            resolve(await getDownloadYoutube(videoId, { clientName: 'TVHTML5', clientVersion: '7.20220918' }, 'www.youtube.com'))
          } else if(client.clientName == 'TVHTML5') {
            resolve(await getDownloadYoutube(videoId, { clientName: 'ANDROID_LITE', clientVersion: '3.26.1' }, 'm.youtube.com'))
          }
        }, 5000);
        return
      }
      if(resJson?.streamingData?.formats) {
        for(let obj of resJson.streamingData.formats) {
            if(!obj.mimeType.includes('video/mp4')) continue
            videosFormats.push({
              quality: obj.qualityLabel,
              duration: obj.approxDurationMs,
              mimeType: obj.mimeType.split(';')[0],
              dl_link: obj.url
            })
        }
      }

      for(let obj of resJson.streamingData.adaptiveFormats) {
        if(!obj.mimeType.includes('audio/mp4') && !obj.mimeType.includes('audio/webm') && !obj.mimeType.includes('video/mp4')) continue
        if(!obj.mimeType.includes('video/mp4')) {
          audioFormats.push({
              quality: obj.bitrate,
              size: (obj.contentLength / Math.pow(1024, 2)).toFixed(2) + 'MB',
              bytes: obj.contentLength,
              mimeType: obj.mimeType.split(';')[0],
              dl_link: obj.url
          })
        } else {
          videosFormats.push({
              quality: obj.qualityLabel,
              duration: obj.approxDurationMs,
              mimeType: obj.mimeType.split(';')[0],
              dl_link: obj.url
          })
        }
      }

      resolve({
        title: resJson.videoDetails.title,
        channelName: resJson.videoDetails.author,
        channelUrl: `https://www.youtube.com/channel/${resJson.videoDetails.channelId}`,
        views: resJson.videoDetails.viewCount,
        description: resJson.videoDetails.shortDescription,
        videoId: videoId,
        audioFormats,
        videosFormats
      })  
    } catch(e) {
      reject('Download Error')
      return
    }
  })
}

export const findBestAudio = async ( downloadInfoYt: DownloadYoutubeInfoType): Promise<AudioFormatType> => {
  var indexBestAudio = 0
  downloadInfoYt.audioFormats.forEach((value, index, arr) => {
    if(downloadInfoYt.audioFormats[indexBestAudio].quality < downloadInfoYt.audioFormats[index].quality 
      && downloadInfoYt.audioFormats[index].mimeType == 'audio/webm') indexBestAudio = index
  })
  return downloadInfoYt.audioFormats[indexBestAudio]
}

export const findBestVideo = async ( downloadInfoYt: DownloadYoutubeInfoType): Promise<VideoFormatType>  => {
  var indexQualitys = {
    '1080p': -1,
    '720p': -1,
    '480p': -1,
    '360p': -1,
    '240p': -1,
    '144p': -1
  }

  downloadInfoYt.videosFormats.forEach((value, index, arr) => {
    if(value.quality == '1080p') indexQualitys["1080p"] = index
    if(value.quality == '720p') indexQualitys["720p"] = index
    if(value.quality == '480p') indexQualitys["480p"] = index
    if(value.quality == '360p') indexQualitys["360p"] = index
    if(value.quality == '240p') indexQualitys["240p"] = index
    if(value.quality == '144p') indexQualitys["144p"] = index
  })

  if(indexQualitys["1080p"] > -1) return downloadInfoYt.videosFormats[indexQualitys["1080p"]]
  else if(indexQualitys["720p"] > -1) return downloadInfoYt.videosFormats[indexQualitys["720p"]]
  else if(indexQualitys["480p"] > -1) return downloadInfoYt.videosFormats[indexQualitys["480p"]]
  else if(indexQualitys["360p"] > -1) return downloadInfoYt.videosFormats[indexQualitys["360p"]]
  else if(indexQualitys["240p"] > -1) return downloadInfoYt.videosFormats[indexQualitys["240p"]]
  else return downloadInfoYt.videosFormats[indexQualitys["144p"]]
}

export const getBufferUrlDownload = async (urlDownload: string): Promise<Buffer> => {
  if(!urlDownload) throw new Error('Invalid URL')
  const requestUrlDownload = await fetch(urlDownload, { headers: { 'range': 'bytes=0-' } })
  return await requestUrlDownload.buffer()
}

export const convertWebmToMp3 = async (bufferInput: Buffer): Promise<Buffer> => {
  return new Promise<Buffer>(async (resolve, reject) => {
    const inputFilename = (Math.random() * 9999).toFixed(0) + '.webm'
    const outpuFilename = (Math.random() * 9999).toFixed(0) + '.mp3'

    fs.writeFileSync(`./src/temp/${inputFilename}`, bufferInput)

    exec(`ffmpeg -i ./src/temp/${inputFilename} -vn ./src/temp/${outpuFilename}`, async (err, stdout, stderr) => {
      if(err) {
        fs.unlinkSync(inputFilename)
        reject(err)
        return
      }

      const outputBuffer = fs.readFileSync(`./src/temp/${outpuFilename}`)
      resolve(outputBuffer)

      fs.unlinkSync(`./src/temp/${inputFilename}`)
      fs.unlinkSync(`./src/temp/${outpuFilename}`)
    })
  })
}

export const getBufferThumb = async (videoId: string): Promise<Buffer> => {
  if(!videoId) throw new Error('Video id is invalid!')
  const requestThumb = await fetch(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
  return requestThumb.buffer()
}

export const writeMetadataAudio = async (downloadInfoYt: DownloadYoutubeInfoType, audioMp3Buffer: Buffer): Promise<Buffer> => {
  const writer = await NodeID3.write({
    title: downloadInfoYt.title,
    artist: downloadInfoYt.channelName,
    album: downloadInfoYt.channelName,
    image: {
      mime: "image/jpeg",
      type: {
        id: 3,
        name: "front cover"
      },
      description: downloadInfoYt.description as string,
      imageBuffer: await getBufferThumb(downloadInfoYt.videoId)
    }
  }, audioMp3Buffer)
  return writer
}

export const searchYoutube = async (query: string): Promise<VideoDetailsType[]> => {
  const requestSearch = await fetch(`https://www.youtube.com/results?search_query=${query}`)
  if(!requestSearch.ok) throw new Error('Failed to request search')

  const htmlSearch = await requestSearch.text()
  const searchJson = JSON.parse(htmlSearch.split('var ytInitialData = ')[1].split(';</script')[0])
  
  const listVideosArray: VideoDetailsType[] = []

  const searchVideosArray = searchJson.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents
  for(const video of searchVideosArray) {
    if(!video.videoRenderer) continue
    const renderer = video.videoRenderer
    
    listVideosArray.push({
      title: renderer.title?.runs[0]?.text,
      videoId: renderer.videoId,
      channelName: renderer.ownerText?.runs[0]?.text,
      duration: renderer.lengthText?.simpleText,
      publishedTime: renderer.publishedTimeText?.simpleText,
      views: renderer.viewCountText?.simpleText
    })
  }

  return listVideosArray
}

export const createYtInfoMessage = (videoDetails: VideoDetailsType): string => {
  return `*🌐 Url: https://youtu.be/${videoDetails.videoId}*\n` +
  `_*🔰 Título: ${videoDetails.title}*_\n` +
  `_*👁️ Views: ${videoDetails.views}*_\n` +
  `_*⏰ Duração: ${videoDetails.duration}*_\n` +
  `_*🗓️ Publicado há: ${videoDetails.publishedTime}*_`
}

export const durationToSeconds = (duration: string): number => {
  const parts = duration.split(":").map(Number);
  let totalSeconds = 0;

  if (parts.length === 3) {
    totalSeconds += parts[0] * 3600; 
    totalSeconds += parts[1] * 60;
    totalSeconds += parts[2];
  } else if (parts.length === 2) {
    totalSeconds += parts[0] * 60;
    totalSeconds += parts[1];
  } else if (parts.length === 1) {
    totalSeconds += parts[0];
  } else {
    throw new Error("Formato de duração inválido");
  }

  return totalSeconds;
}