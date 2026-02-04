
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Calendar,
    Users,
    Mic,
    Settings,
    Leaf,
    MessageCircle,
    BookOpen,
    BarChart3
} from "lucide-react"
import UnreadBadge from "@/components/crm/UnreadBadge"

const routes = [
    {
        label: "ダッシュボード",
        icon: LayoutDashboard,
        href: "/dashboard",
    },
    {
        label: "予約カレンダー",
        icon: Calendar,
        href: "/dashboard/calendar",
    },
    {
        label: "メンバー管理",
        icon: Users,
        href: "/dashboard/members",
    },
    {
        label: "1:1チャット",
        icon: MessageCircle,
        href: "/dashboard/crm/chats",
    },
    {
        label: "リッチメニュー",
        icon: MessageCircle, // Or usage of another icon like Menu
        href: "/dashboard/crm/rich-menus",
    },
    {
        label: "メッセージ",
        icon: MessageCircle, // Use distinct icon if available, e.g. Send
        href: "/dashboard/crm/messages",
    },
    {
        label: "情報管理",
        icon: BookOpen,
        href: "/dashboard/info",
    },
    {
        label: "売上表",
        icon: BarChart3,
        href: "/dashboard/sales",
    },
    {
        label: "設定",
        icon: Settings,
        href: "/dashboard/settings",
    },
]

export const Sidebar = () => {
    const pathname = usePathname()

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-white border-r border-slate-100 text-slate-600 shadow-sm">
            <div className="px-6 py-4 flex-1">
                <Link href="/dashboard" className="flex flex-col mb-10 pl-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Leaf className="w-6 h-6 text-emerald-600" />
                        <h1 className="text-2xl font-serif text-slate-800 tracking-tight">
                            SHEEKA
                        </h1>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                        Powered by wellness space CLOVER.
                    </p>
                </Link>

                <div className="space-y-6">
                    {/* Main */}
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Store</p>
                        {routes.slice(0, 3).map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200",
                                    pathname === route.href
                                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                                        : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <route.icon className={cn("h-5 w-5 mr-3 transition-colors",
                                        pathname === route.href ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                                    )} />
                                    {route.label}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* CRM */}
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">CRM (L-Message)</p>
                        {routes.slice(3, 6).map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200",
                                    pathname === route.href
                                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                                        : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center flex-1 w-full">
                                    <route.icon className={cn("h-5 w-5 mr-3 transition-colors flex-shrink-0",
                                        pathname === route.href ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                                    )} />
                                    <span>{route.label}</span>
                                    {route.label === "1:1チャット" && <UnreadBadge />}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Management */}
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Management</p>
                        {routes.slice(6).map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200",
                                    pathname === route.href
                                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                                        : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <route.icon className={cn("h-5 w-5 mr-3 transition-colors",
                                        pathname === route.href ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                                    )} />
                                    {route.label}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-50">
                <div className="text-xs text-slate-400 text-center">
                    &copy; 2026 SHEEKA Platform
                </div>
            </div>
        </div>
    )
}
