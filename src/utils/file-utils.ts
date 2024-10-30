import fs from 'fs'

export const generateFilename = (ext: string) => {
    return (Math.random() * 9999).toFixed(0) + '.' + ext
}

export const clearTempFiles = () => {
    const dirTemp = fs.readdirSync('./src/temp')
    dirTemp.forEach((value) => {
       fs.unlinkSync(`./src/temp/${value}`) 
    })
}