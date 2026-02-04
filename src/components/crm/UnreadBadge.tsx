'use client'

import { useState, useEffect } from "react"
import { getGlobalUnreadCount } from "@/app/actions/chat_actions"
import { Badge } from "@/components/ui/badge"

export default function UnreadBadge() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const fetchCount = async () => {
            const result = await getGlobalUnreadCount()
            setCount(result.count)
        }

        fetchCount() // Initial fetch

        // Poll every 10 seconds
        const interval = setInterval(fetchCount, 10000)

        return () => clearInterval(interval)
    }, [])

    if (count === 0) return null

    return (
        <Badge className="bg-red-500 hover:bg-red-600 h-5 px-1.5 min-w-[20px] justify-center ml-auto transition-all animate-in zoom-in">
            {count > 99 ? '99+' : count}
        </Badge>
    )
}
