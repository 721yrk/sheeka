'use server'

import { prisma } from "@/lib/db"
import { sendLineMessage } from "@/lib/line"

// Define simple types for client-side usage
type LineMessagePayload = string | {
    type: 'sticker';
    packageId: string;
    stickerId: string;
} | {
    type: 'image';
    originalContentUrl: string;
    previewImageUrl: string;
}

export async function sendLineMessageToUser(userId: string, content: LineMessagePayload) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user || !user.lineUserId) {
            return { error: 'LINE連携されていないユーザーです' }
        }

        // Send to LINE
        // If content is string, it's text. If object, pass as is (needs casting or proper type)
        const success = await sendLineMessage(user.lineUserId, content as any)

        if (success) {
            // Determine log text
            let logText = '';
            if (typeof content === 'string') {
                logText = content;
            } else if (content.type === 'sticker') {
                logText = '[スタンプ送信]';
            } else if (content.type === 'image') {
                logText = '[画像送信]';
            } else {
                logText = '[その他メッセージ]';
            }

            // Log to ChatMessage
            await prisma.chatMessage.create({
                data: {
                    userId: userId,
                    sender: 'ADMIN',
                    content: logText,
                    isRead: true
                }
            })
            return { success: true, message: 'メッセージを送信しました' }
        } else {
            return { error: 'LINEメッセージの送信に失敗しました' }
        }
    } catch (error) {
        console.error('Error sending message:', error)
        return { error: '送信中にエラーが発生しました' }
    }
}
