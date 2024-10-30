import { proto } from "@whiskeysockets/baileys";
import { socket } from "../../../main";
import { getMessageDetails } from "../../utils/message-utils";
import menu from "../../messages/menu";
import { thumbMenuBuffer } from "../../global/global";
const handler = async (msg: proto.IWebMessageInfo) => {
    const contentMessage = getMessageDetails(msg)

    socket.sendMessage(contentMessage.from, { image: thumbMenuBuffer, caption: menu})
}

handler.commands = ['menu', 'm']
export default handler