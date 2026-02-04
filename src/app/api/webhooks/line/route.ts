import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent } from '@line/bot-sdk';
import { prisma } from '@/lib/db';
import { lineConfig } from '@/lib/line';

const client = new Client(lineConfig);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const headers = {
            'x-line-signature': req.headers.get('x-line-signature') as string,
        };

        // In a real production app, verify signature here using @line/bot-sdk middleware or manual verification
        // For now, we trust the obscure endpoint path for rapid prototyping or implement simple check

        const events: WebhookEvent[] = body.events;

        await Promise.all(
            events.map(async (event) => {
                const lineUserId = event.source.userId;
                if (!lineUserId) return;

                // 1. Handle Friend Add (Follow)
                if (event.type === 'follow') {
                    console.log(`New follower: ${lineUserId}`);
                    try {
                        const profile = await client.getProfile(lineUserId);

                        // Upsert user to capture 'friend' status
                        await prisma.user.upsert({
                            where: { lineUserId },
                            update: {
                                name: profile.displayName,
                                lineDisplayName: profile.displayName,
                                linePictureUrl: profile.pictureUrl,
                                isLineFriend: true
                            },
                            create: {
                                lineUserId,
                                name: profile.displayName,
                                lineDisplayName: profile.displayName,
                                linePictureUrl: profile.pictureUrl,
                                isLineFriend: true,
                                email: `line_${lineUserId}@sheeka.local`, // Placeholder unique email
                                passwordHash: '$2a$12$DummyHashForLineUser_______________________', // Unusable hash
                                role: 'MEMBER',
                                memberProfile: {
                                    create: {
                                        name: profile.displayName,
                                        dateOfBirth: new Date(), // Dummy
                                        gender: 'UNKNOWN',
                                        phone: '',
                                        emergencyContact: ''
                                    }
                                }
                            }
                        });

                        await client.replyMessage(event.replyToken, {
                            type: 'text',
                            text: '友だち追加ありがとうございます！\nSHEEKA Wellnessへようこそ。'
                        });
                    } catch (e) {
                        console.error('Error handling follow event:', e);
                    }
                }

                // 2. Handle Unfollow (Block)
                if (event.type === 'unfollow') {
                    console.log(`Unfollowed by: ${lineUserId}`);
                    try {
                        await prisma.user.update({
                            where: { lineUserId },
                            data: { isLineFriend: false }
                        });
                    } catch (e) {
                        console.error('Error handling unfollow event:', e);
                    }
                }

                // 3. Handle Text Message
                if (event.type === 'message' && event.message.type === 'text') {
                    try {
                        // Find user first
                        let user = await prisma.user.findUnique({ where: { lineUserId } });

                        // If user doesn't exist (e.g. Added friend before Webhook implementation), create them now
                        if (!user) {
                            try {
                                const profile = await client.getProfile(lineUserId);
                                user = await prisma.user.create({
                                    data: {
                                        lineUserId,
                                        name: profile.displayName,
                                        lineDisplayName: profile.displayName,
                                        linePictureUrl: profile.pictureUrl,
                                        isLineFriend: true,
                                        email: `line_${lineUserId}@sheeka.local`,
                                        passwordHash: '$2a$12$DummyHashForLineUser_______________________',
                                        role: 'MEMBER',
                                        memberProfile: {
                                            create: {
                                                name: profile.displayName,
                                                dateOfBirth: new Date(),
                                                gender: 'UNKNOWN',
                                                phone: '',
                                                emergencyContact: ''
                                            }
                                        }
                                    }
                                });
                            } catch (error) {
                                console.error('Error creating user from message event:', error);
                            }
                        }

                        if (user) {
                            // Store message
                            await prisma.chatMessage.create({
                                data: {
                                    userId: user.id,
                                    sender: 'USER',
                                    content: event.message.text
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Error storing message:', e);
                    }
                }
            })
        );

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Error handling LINE webhook:', error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}
