'use server'

import { prisma } from "@/lib/db"

export async function getGlobalUnreadCount() {
    try {
        const count = await prisma.chatMessage.count({
            where: {
                sender: 'USER',
                isRead: false
            }
        })
        return { count }
    } catch (error) {
        console.error('Error fetching unread count:', error)
        return { count: 0 }
    }
}
