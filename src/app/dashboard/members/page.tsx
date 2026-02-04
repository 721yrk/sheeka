
import { prisma } from "@/lib/db"
import { Users, Calendar, ShoppingBag } from "lucide-react"
import { redirect } from "next/navigation"
import { WorkoutLogger } from "@/components/training/WorkoutLogger"
import { MemberAddModal } from "@/components/members/MemberAddModal"
import { ProfileCard } from "@/components/members/ProfileCard"
import { VisionCard } from "@/components/members/VisionCard"
import { MemberSettingsCard } from "@/components/members/MemberSettingsCard"
import { ConditioningLogger } from "@/components/members/ConditioningLogger"
import { BodyGallery } from "@/components/members/BodyGallery"

export const dynamic = "force-dynamic"

export default async function MembersPage({ searchParams }: { searchParams: { id?: string } }) {
    const { id: selectedMemberId } = await searchParams;

    // Fetch with relation to get email from User
    const membersRaw = await prisma.member.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            user: true
        }
    })

    // Normalize data
    const members = membersRaw.map(m => ({
        ...m, // Spread first to include all DB fields (id, name, etc.)
        email: m.user?.email || "No Email",
        joinDate: new Date(m.joinDate),
    }))

    // Default selection
    const selectedMember = selectedMemberId
        ? members.find(m => m.id === selectedMemberId)
        : members[0]

    // Fetch available trainers for selection
    const trainers = await prisma.user.findMany({
        where: { OR: [{ role: 'TRAINER' }, { title: { contains: 'Trainer' } }, { name: { in: ['Yuji', 'Risa', 'ゆうじ', 'りさ'] } }] },
        select: { id: true, name: true }
    })

    return (
        <div className="p-8 space-y-6 bg-neutral-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <Users className="w-5 h-5 text-emerald-600" />
                    メンバー管理総合ダッシュボード
                </h2>
                <MemberAddModal trainers={trainers} />
            </div>

            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-10rem)]">
                {/* Left Sidebar: Member List (3 cols) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="bg-white rounded-lg border shadow-sm p-3 h-full overflow-y-auto">
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Members List</div>
                        <div className="space-y-2">
                            {members.map(member => {
                                const joinDate = member.joinDate
                                const now = new Date()
                                const diffYears = (joinDate instanceof Date && !isNaN(joinDate.getTime()))
                                    ? (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
                                    : 0

                                let rankColor = "bg-slate-100 text-slate-500"
                                if (diffYears >= 10) rankColor = "bg-blue-100 text-blue-600"
                                else if (diffYears >= 7) rankColor = "bg-slate-800 text-white"
                                else if (diffYears >= 5) rankColor = "bg-yellow-100 text-yellow-600"
                                else if (diffYears >= 3) rankColor = "bg-slate-200 text-slate-600"
                                else if (diffYears >= 1) rankColor = "bg-amber-100 text-amber-700"

                                const isSelected = selectedMember?.id === member.id

                                return (
                                    <form key={member.id} action={async () => {
                                        "use server"
                                        redirect(`/dashboard/members?id=${member.id}`)
                                    }}>
                                        <button className={`w-full text-left p-3 rounded transition-all ${isSelected ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className={`font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>{member.name}</div>
                                                <div className={`text-[10px] px-1.5 py-0.5 rounded ${rankColor}`}>
                                                    {diffYears >= 1 ? `${Math.floor(diffYears)}年` : '新人'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                <span>{member.plan}</span>
                                            </div>
                                        </button>
                                    </form>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Content: 5-Block Grid (9 cols) */}
                <div className="col-span-12 lg:col-span-9 h-full overflow-y-auto pr-1">
                    {selectedMember ? (
                        <div className="grid grid-cols-2 gap-4 auto-rows-min pb-10">

                            {/* Block 1: Profile (Top Left) */}
                            <div className="col-span-2 lg:col-span-1 h-[550px]">
                                <ProfileCard member={selectedMember} />
                            </div>

                            {/* Block 2: Vision (Top Right) */}
                            <div className="col-span-2 lg:col-span-1 h-[550px]">
                                <VisionCard member={selectedMember} />
                            </div>

                            {/* Block 3: Member Settings (Full Width) */}
                            <div className="col-span-2 h-[300px]">
                                <MemberSettingsCard member={selectedMember} />
                            </div>

                            {/* Block 4: Conditioning (Middle Full Width) */}
                            <div className="col-span-2 h-[450px]">
                                <ConditioningLogger memberId={selectedMember.id} />
                            </div>

                            {/* Block 5: Workout Analytics (Large) */}
                            <div className="col-span-2 h-[500px]">
                                <WorkoutLogger memberId={selectedMember.id} trainerId={null} />
                            </div>

                            {/* Block 6: Body Gallery (Bottom) */}
                            <div className="col-span-2 h-[340px]">
                                <BodyGallery memberId={selectedMember.id} />
                            </div>

                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            メンバーを選択してください
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
