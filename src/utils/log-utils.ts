import { WAConnectionState } from "@whiskeysockets/baileys";
import chalk from "chalk";
const chalkBold = chalk.bold

export const sendConnectionLog = (type: WAConnectionState, message: string) => {
    if(type == 'close') console.log(`${chalkBold.blue('[')}${chalkBold.red('CONEXÃO')}${chalkBold.blue(']')} ${chalkBold.yellow(message)}`)
    else if(type == 'connecting') console.log(`${chalkBold.blue('[')}${chalkBold.cyan('CONEXÃO')}${chalkBold.blue(']')} ${chalkBold.yellow(message)}`)
    else console.log(`${chalkBold.blue('[')}${chalkBold.green('CONEXÃO')}${chalkBold.blue(']')} ${chalkBold.yellow(message)}`)
}

export const sendCallLog = (message: string) => {
    console.log(`${chalkBold.blue('[')}${chalkBold.red('LIGAÇÃO')}${chalkBold.blue(']')} ${chalkBold.yellow(message)}`)
}

export const sendMessageLog = (number: string, messageType: string, isCmd: boolean) => {
    const date = new Date()

    console.log(`${chalkBold.blue('[')}${chalkBold.yellow('MENSAGEM')}${chalkBold.blue(']')} ` + 
    `${chalkBold.blue('[')} ${chalkBold.white('Número: ')}${chalkBold.green(number)} ${chalkBold.blue(']')} ` + 
    `${chalkBold.blue('[')} ${chalkBold.white('Mensagem: ')}${chalkBold.green(messageType)} ${chalkBold.blue(']')} ` +
    `${chalkBold.blue('[')} ${chalkBold.white('Comando: ')}${chalkBold.green(isCmd ? 'Sim' : 'Não')} ${chalkBold.blue(']')} ` +
    `${chalkBold.blue('[')} ${chalkBold.white('Data: ')}${chalkBold.green(date.toLocaleString())} ${chalkBold.blue(']')}`)
}