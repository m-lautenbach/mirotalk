import { type BrowserContext, chromium, expect, type Page, test } from '@playwright/test';
import * as path from 'path';

// Paths to the simulated video files
const videoFile1 = path.resolve(__dirname, './videos/test1.y4m');
const videoFile2 = path.resolve(__dirname, './videos/test2.y4m');

const WEBRTC_TEST_URL = 'http://localhost:3000/join/test';

test.describe('WebRTC Application Test with Simulated Video Feeds', () => {
    let browserContext1: BrowserContext;
    let browserContext2: BrowserContext;
    let user1: Page;
    let user2: Page;

    test.beforeEach(async () => {
        // Launch two separate browser contexts with different video feeds
        browserContext1 = await chromium.launchPersistentContext('', {
            args: [
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                `--use-file-for-fake-video-capture=${videoFile1}`,
            ],
        });

        browserContext2 = await chromium.launchPersistentContext('', {
            args: [
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                `--use-file-for-fake-video-capture=${videoFile2}`,
            ],
        });

        user1 = await browserContext1.newPage();
        user2 = await browserContext2.newPage();
    });

    test.afterEach(async () => {
        await browserContext1.close();
        await browserContext2.close();
    });

    test('should establish a WebRTC call with simulated video feeds', async () => {
        // --- User 1 (Initiator) ---
        await user1.goto(WEBRTC_TEST_URL);
        await user1.locator('input#usernameInput.swal2-input').fill('User 1');
        await user1.locator('.swal2-confirm').click();

        // --- User 2 (Joiner) ---
        await user2.goto(WEBRTC_TEST_URL);
        await user2.locator('input#usernameInput.swal2-input').fill('User 2');
        await user2.locator('.swal2-confirm').click();

        // --- Verification ---
        // Wait for at least two video elements to be present on page1
        await user1.waitForFunction(() => document.querySelectorAll('video').length >= 2);
        await user2.waitForFunction(() => document.querySelectorAll('video').length >= 2);

        const isPage1LocalVideoPlaying = await user1.evaluate(() => {
            const video = document.querySelectorAll<HTMLVideoElement>('video')[0];
            return video && video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2;
        });

        const isPage1RemoteVideoPlaying = await user1.evaluate(() => {
            const video = document.querySelectorAll<HTMLVideoElement>('video')[1];
            return video && video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2;
        });

        const isPage2LocalVideoPlaying = await user2.evaluate(() => {
            const video = document.querySelectorAll<HTMLVideoElement>('video')[0];
            return video && video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2;
        });

        const isPage2RemoteVideoPlaying = await user2.evaluate(() => {
            const video = document.querySelectorAll<HTMLVideoElement>('video')[1];
            return video && video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2;
        });

        expect(isPage1LocalVideoPlaying).toBe(true);
        expect(isPage1RemoteVideoPlaying).toBe(true);
        expect(isPage2LocalVideoPlaying).toBe(true);
        expect(isPage2RemoteVideoPlaying).toBe(true);
    });
});
