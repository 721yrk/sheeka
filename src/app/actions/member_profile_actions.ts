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

        const existingMember = await prisma.member.findUnique({
            where: { userId }
        })

        if (existingMember) {
            await prisma.member.update({
                where: { id: existingMember.id },
                data: {
                    name, // Sync name
                    kana,
                    gender,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                    joinDate: joinDate ? new Date(joinDate) : undefined,
                }
            })
        } else {
            // Create if missing (unlikely given app structure but safe fallback)
            // But creating requires other fields. Assuming it exists for now based on 'MemberDetailPage'
            console.error("Member profile not found for user: " + userId)
            return { error: 'Member profile not found' }
        }

        revalidatePath(`/dashboard/crm/members/${userId}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating profile:', error)
        return { error: '保存に失敗しました' }
    }
}
