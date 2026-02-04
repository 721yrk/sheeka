
"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateMemberProfile(
    memberId: string,
    data: {
        medicalHistory?: string
        exerciseHistory?: string
        height?: number | null
        currentCondition?: string
    }
) {
    await prisma.member.update({
        where: { id: memberId },
        data
    })
    revalidatePath(`/dashboard/members`)
}

export async function updateMemberVision(memberId: string, data: { goals?: string, purpose?: string, vision?: string }) {
    await prisma.member.update({
        where: { id: memberId },
        data
    })
    revalidatePath(`/dashboard/members`)
}

export async function addConditioningLog(memberId: string, data: { stiffness: string, weakness: string, adjustment: string, notes?: string }) {
    await prisma.conditioningLog.create({
        data: {
            memberId,
            ...data
        }
    })
    revalidatePath(`/dashboard/members`)
}

export async function getConditioningLogs(memberId: string) {
    return await prisma.conditioningLog.findMany({
        where: { memberId },
        orderBy: { date: 'desc' },
        take: 5
    })
}

export async function addBodyRecord(memberId: string, photoBase64: string) {
    await prisma.bodyRecord.create({
        data: {
            memberId,
            date: new Date(),
            photoUrl: photoBase64
        }
    })
    revalidatePath(`/dashboard/members`)
}

export async function getBodyRecords(memberId: string) {
    return await prisma.bodyRecord.findMany({
        where: { memberId },
        orderBy: { date: 'asc' }
    })
}

export async function updateMemberSettings(
    memberId: string,
    data: {
        plan?: string
        contractedSessions?: number
        mainTrainerId?: string | null
        prepaidBalance?: number
    }
) {
    await prisma.member.update({
        where: { id: memberId },
        data
    })
    revalidatePath(`/dashboard/members`)
}
