export type MessageDetailsType = {
    from: string
    sender: string
    is_group: boolean
    message_type: string
    quoted_message_type: string | null
    pushname: string
    body: string | null
    is_cmd: boolean
    args: string[]
    cmd: string | null
    is_status: boolean
}

export type ReplyMessageType = 'info' | 'error' | 'warn'