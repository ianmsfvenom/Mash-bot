
export type VideoDetailsType = {
    videoId: string
    title: string
    channelName: string
    publishedTime: string
    duration: string
    views: string
}
  
export type VideoFormatType = {
    quality: '1080p' | '720p' | '480p' | '360p' | '240p' | '144p'
    duration: string
    mimeType: string
    dl_link: string
  }
  
export type AudioFormatType = {
    quality: number
    size: string
    bytes: number
    mimeType: string
    dl_link: string
}
  
export type DownloadYoutubeInfoType = {
    title: string
    channelName: string
    channelUrl: string
    views: string
    description: string | undefined
    videoId: string
    audioFormats: AudioFormatType[]
    videosFormats: VideoFormatType[]
}
  