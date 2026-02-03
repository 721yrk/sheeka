import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { lineClient } from "@/lib/line" // We need to export 'lineClient' from here or line-admin
import { RichMenu } from "@line/bot-sdk"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, chatBarText, layout } = body

        // 1. Define the Rich Menu Object for LINE
        // For this MVP, we used a fixed template "Compact_2" which has 2 buttons.
        // Left: Booking, Right: My Page

        // Dynamic URL based on environment would be better, but hardcoding prod/vercel url for now or relative
        // LINE requires Absolute URLs.
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://sheeka-wellness.vercel.app"

        const richMenuObject: RichMenu = {
            size: {
                width: 2500,
                height: 843
            },
            selected: true,
            name: name,
            chatBarText: chatBarText || "メニュー",
            areas: [
                {
                    bounds: {
                        x: 0,
                        y: 0,
                        width: 1250,
                        height: 843
                    },
                    action: {
                        type: "uri",
                        label: "予約する",
                        uri: `${baseUrl}/member-app/booking`
                    }
                },
                {
                    bounds: {
                        x: 1250,
                        y: 0,
                        width: 1250,
                        height: 843
                    },
                    action: {
                        type: "uri",
                        label: "マイページ",
                        uri: `${baseUrl}/member-app/settings`
                    }
                }
            ]
        }

        // 2. Call LINE API to create rich menu
        const richMenuId = await lineClient.createRichMenu(richMenuObject)

        // 3. Upload Image
        try {
            // Read default image from public folder
            const fs = require('fs')
            const path = require('path')
            const imagePath = path.join(process.cwd(), 'public', 'images', 'rich_menu_default.png')

            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath)
                await lineClient.setRichMenuImage(richMenuId, imageBuffer)
                console.log(`Uploaded image for rich menu ${richMenuId}`)
            } else {
                console.warn("Default rich menu image not found, skipping upload.")
            }
        } catch (imgError) {
            console.error("Failed to upload rich menu image:", imgError)
            // Continue, don't fail the whole process but menu will be blank
        }

        // 4. Save to Database
        const richMenu = await prisma.richMenu.create({
            data: {
                lineMenuId: richMenuId,
                name: name,
                chatBarText: chatBarText,
                selected: true,
                jsonConfig: richMenuObject as any,
                imageUrl: '/images/rich_menu_default.png' // Save reference to public image
            }
        })

        // 5. Set as Default for all users
        try {
            await lineClient.setDefaultRichMenu(richMenuId)
        } catch (e) {
            console.error("Failed to set default rich menu", e)
        }

        return NextResponse.json({ success: true, richMenuId })
    } catch (error) {
        console.error("Error creating rich menu:", error)
        return NextResponse.json({ success: false, error: "Failed to create rich menu" }, { status: 500 })
    }
}
