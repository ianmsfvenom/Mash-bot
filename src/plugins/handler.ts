import fs from 'fs'
import { CommandPluginType } from '../types/command'


export const loadCommands = async () => {
    const filePluginsArray: string[] = fs.readdirSync('./src/plugins/commands/')
    const commandsArray: CommandPluginType[] = []
    
    for(let fileName of filePluginsArray) {
        if(!fileName.endsWith('.ts')) continue

        const module = require(`./commands/${fileName}`)
        if(typeof module.default !== 'function' || (module.default.commands && Array.isArray(module.default.commands)))
        
        commandsArray.push(module.default as CommandPluginType)
    }

    return commandsArray
}