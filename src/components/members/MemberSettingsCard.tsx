"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Edit2, Save, X } from "lucide-react"
import { MEMBER_PLANS } from "@/lib/constants"
import { updateMemberSettings } from "@/app/actions/members_actions"

const PLAN_OPTIONS = [
    { value: MEMBER_PLANS.STANDARD.id, label: MEMBER_PLANS.STANDARD.label, color: "bg-emerald-100 text-emerald-700" },
    { value: MEMBER_PLANS.PREMIUM.id, label: MEMBER_PLANS.PREMIUM.label, color: "bg-indigo-100 text-indigo-700" },
    { value: MEMBER_PLANS.DIGITAL_PREPAID.id, label: MEMBER_PLANS.DIGITAL_PREPAID.label, color: "bg-blue-100 text-blue-700" },
    { value: MEMBER_PLANS.TICKET.id, label: MEMBER_PLANS.TICKET.label, color: "bg-amber-100 text-amber-700" },
]

export function MemberSettingsCard({ member }: { member: any }) {
    const [isEditing, setIsEditing] = useState(false)
    const [plan, setPlan] = useState(member.plan || "STANDARD")
    const [contractedSessions, setContractedSessions] = useState(member.contractedSessions?.toString() || "4")
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateMemberSettings(member.id, {
                plan,
                contractedSessions: parseInt(contractedSessions)
            })
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to update member settings:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setPlan(member.plan || "STANDARD")
        setContractedSessions(member.contractedSessions?.toString() || "4")
        setIsEditing(false)
    }

    const currentPlanOption = PLAN_OPTIONS.find(p => p.value === plan) || PLAN_OPTIONS[0]

    return (
        <Card className="h-full border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-slate-50 border-b flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    契約設定
                </CardTitle>
                {!isEditing ? (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-3 h-3 text-slate-400" />
                    </Button>
                ) : (
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={handleCancel} disabled={isSaving}>
                            <X className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-500" onClick={handleSave} disabled={isSaving}>
                            <Save className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {/* Plan Selection */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">プラン</label>
                    {isEditing ? (
                        <Select value={plan} onValueChange={setPlan} disabled={isSaving}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PLAN_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className={`px-3 py-2 rounded-lg font-medium text-sm ${currentPlanOption.color}`}>
                            {currentPlanOption.label}
                        </div>
                    )}
                </div>

                {/* Contracted Sessions */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">月間契約回数</label>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="1"
                                max="30"
                                className="w-20"
                                value={contractedSessions}
                                onChange={e => setContractedSessions(e.target.value)}
                                disabled={isSaving}
                            />
                            <span className="text-sm text-slate-500">回/月</span>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold text-indigo-600">
                            {contractedSessions} <span className="text-sm text-slate-500 font-normal">回/月</span>
                        </div>
                    )}
                </div>

                {/* Summary Info */}
                <div className="pt-3 border-t space-y-2">
                    <div className="text-xs text-slate-500">
                        <span className="font-semibold">現在のプラン:</span> {currentPlanOption.label}
                    </div>
                    <div className="text-xs text-slate-500">
                        <span className="font-semibold">月間契約:</span> {contractedSessions}回まで
                    </div>

                </div>
            </CardContent>
        </Card>
    )
}
