import { Client, MiddlewareConfig } from '@line/bot-sdk';

export const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'build_placeholder',
    channelSecret: process.env.LINE_CHANNEL_SECRET || 'build_placeholder',
};

export const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'build_placeholder',
    channelSecret: process.env.LINE_CHANNEL_SECRET || 'build_placeholder',
});

export async function sendLineMessage(userId: string, text: string) {
    try {
        await lineClient.pushMessage(userId, {
            type: 'text',
            text: text,
        });
        console.log(`Message sent to ${userId}`);
        return true;
    } catch (error) {
        console.error('Error sending LINE message:', error);
        return false;
    }
}
