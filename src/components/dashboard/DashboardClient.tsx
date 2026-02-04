"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, TrendingUp, UserPlus, UserMinus, CalendarCheck, Wallet } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardData {
    memberStats: {
        total: number;
        standard: number;
        premium: number;
        digitalPrepaid: number;
        ticket: number;
    };
    genderData: any[]; // { name, value, color }
    ageData: any[]; // { age, male, female }
    capacityData: any[]; // { name, current, max }
    financials: {
        monthly: number;
        annual: number;
    };
    flow: {
        newEntries: number;
        withdrawals: number;
        trials: number;
    };
    bookingStats: {
        total: number;
        standard: number;
        premium: number;
        digitalPrepaid: number;
        ticket: number;
        additional: number;
        transfer: number;
    };
}

export default function DashboardClient({ data }: { data: DashboardData }) {
    if (!data) return <div className="p-8">Loading...</div>

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val)
    }

    return (
        <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        管理者ダッシュボード
                    </h1>
                    <p className="text-sm text-slate-500">店舗運営ステータス (Store Operations Status)</p>
                </div>
                <div className="text-xs text-slate-400">
                    {new Date().toLocaleDateString('ja-JP')} 更新
                </div>
            </div>

            {/* --- TOP METRICS: Members & Sales & Flow --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">総会員数</CardTitle>
                        <Users className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{data.memberStats.total} <span className="text-xs font-normal text-slate-400">名</span></div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">月間売上予測</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-slate-800">{formatCurrency(data.financials.monthly)}</div>
                        <p className="text-[10px] text-slate-400 mt-1">年間予想: {formatCurrency(data.financials.annual)}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">月間フロー (入/退/体)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="flex justify-between items-end pt-2">
                        <div className="text-center">
                            <div className="text-xs text-slate-400">入会</div>
                            <div className="text-lg font-bold text-emerald-600">{data.flow.newEntries}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-slate-400">退会</div>
                            <div className="text-lg font-bold text-rose-500">{data.flow.withdrawals}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-slate-400">体験</div>
                            <div className="text-lg font-bold text-blue-600">{data.flow.trials}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">月間予約数</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{data.bookingStats.total} <span className="text-xs font-normal text-slate-400">件</span></div>
                    </CardContent>
                </Card>
            </div>

            {/* --- ROW 2: Contract Breakdown & Demographics --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Contract Breakdown */}
                <Card className="col-span-1 border-t-2 border-t-emerald-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-slate-700">会員契約内訳</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">スタンダード</span>
                                <span className="font-bold">{data.memberStats.standard}名</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(data.memberStats.standard / data.memberStats.total) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">プレミアム</span>
                                <span className="font-bold">{data.memberStats.premium}名</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500" style={{ width: `${(data.memberStats.premium / data.memberStats.total) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">デジタルプリペイド</span>
                                <span className="font-bold">{data.memberStats.digitalPrepaid}名</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${(data.memberStats.digitalPrepaid / data.memberStats.total) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">回数券</span>
                                <span className="font-bold">{data.memberStats.ticket}名</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${(data.memberStats.ticket / data.memberStats.total) * 100}%` }}></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Gender Ratio */}
                <Card className="col-span-1 border-t-2 border-t-blue-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-slate-700">男女比 (Gender Ratio)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend verticalAlign="bottom" height={36} />
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-10 text-center pointer-events-none">
                            <div className="text-2xl font-bold text-slate-700">{data.memberStats.total}</div>
                            <div className="text-[10px] text-slate-400">Members</div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Trainer Capacity */}
                <Card className="col-span-1 border-t-2 border-t-indigo-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-slate-700">担当枠状況 (Remaining Capacity)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {data.capacityData.map((trainer) => {
                            const percent = (trainer.current / trainer.max) * 100
                            return (
                                <div key={trainer.name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="font-bold text-slate-700">{trainer.name}</span>
                                        <span className="text-xs text-slate-500">{trainer.current} / {trainer.max} 枠</span>
                                    </div>
                                    <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${percent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <p className="text-right text-xs font-medium text-slate-600">残 {trainer.max - trainer.current} 枠</p>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* --- ROW 3: Age Pyramid & Booking Breakdown --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">

                {/* Age Pyramid */}
                <Card className="col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-slate-700">会員年代分布 (Age Structure)</CardTitle>
                        <CardDescription>男女別年齢構成 (左: 男性, 右: 女性)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={data.ageData}
                                stackOffset="sign"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="age" type="category" width={40} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => Math.abs(Number(value))} />
                                <Legend />
                                <Bar dataKey="male" name="男性" fill="#3b82f6" stackId="stack" />
                                <Bar dataKey="female" name="女性" fill="#ec4899" stackId="stack" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Booking Breakdown Table */}
                <Card className="col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-slate-700">予約内訳 (Booking Breakdown)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {[
                                { label: 'スタンダード予約', val: data.bookingStats.standard, color: 'text-emerald-600' },
                                { label: 'プレミアム予約', val: data.bookingStats.premium, color: 'text-violet-600' },
                                { label: 'デジタルプリペイド予約', val: data.bookingStats.digitalPrepaid, color: 'text-blue-600' },
                                { label: '回数券予約', val: data.bookingStats.ticket, color: 'text-amber-600' },
                                { label: '追加セッション', val: data.bookingStats.additional, color: 'text-slate-600' },
                                { label: '振替', val: data.bookingStats.transfer, color: 'text-slate-600' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                                    <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                                    <span className={`text-sm font-bold ${item.color}`}>{item.val}件</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
