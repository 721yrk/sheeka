'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateMemberProfile(formData: FormData) {
    const userId = formData.get('userId') as string
    const name = formData.get('name') as string
    const kana = formData.get('kana') as string
    const gender = formData.get('gender') as string
    const dateOfBirth = formData.get('dateOfBirth') as string
    const joinDate = formData.get('joinDate') as string

    console.log(`[updateMemberProfile] userId: ${userId}`) // Debug log

    if (!userId) return { error: 'Invalid User ID' }

    try {
        // Update User (name)
        await prisma.user.update({
            where: { id: userId },
            data: { name }
        })

        // Update Member Profile
        // Note: memberProfile might not exist if data was migrated, so use upsert or just update if we know it exists.
        // Usually 'User' has 'Member' relation one-to-one via 'UserAsMember'.
        // Let's find the member record first.

        // Create or Update Member Profile
        await prisma.member.upsert({
            where: { userId: userId },
            update: {
                name,
                kana,
                gender,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                joinDate: joinDate ? new Date(joinDate) : undefined,
            },
            create: {
                userId,
                name,
                kana,
                gender: gender || 'UNKNOWN',
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
                joinDate: joinDate ? new Date(joinDate) : new Date(),
                phone: '', // Required field fallback
                emergencyContact: '', // Required field fallback
            }
        })

        revalidatePath(`/dashboard/crm/members/${userId}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating profile:', error)
        return { error: '保存に失敗しました' }
    }
}
