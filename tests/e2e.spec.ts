import { type BrowserContext, chromium, type Page, test } from '@playwright/test';
import * as path from 'path';

// Paths to the simulated video files
const videoFile1 = path.resolve(__dirname, './videos/test1.y4m');
const videoFile2 = path.resolve(__dirname, './videos/test2.y4m');
const videoFile3 = path.resolve(__dirname, './videos/test3.y4m');

const WEBRTC_TEST_URL = 'http://localhost:3000/join/test';

test.describe('WebRTC Application Test with Simulated Video Feeds', () => {
    let browserContext1: BrowserContext;
    let browserContext2: BrowserContext;
    let browserContext3: BrowserContext;
    let user1: Page;
    let user2: Page;
    let user3: Page;

    test.beforeEach(async () => {
        // Launch two separate browser contexts with different video feeds
        browserContext1 = await chromium.launchPersistentContext('', {
            args: [
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                `--use-file-for-fake-video-capture=${videoFile1}`,
                '--window-position=0,0',
            ],
        });

        browserContext2 = await chromium.launchPersistentContext('', {
            args: [
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                `--use-file-for-fake-video-capture=${videoFile2}`,
                '--window-position=1200,0',
            ],
        });
        browserContext3 = await chromium.launchPersistentContext('', {
            args: [
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                `--use-file-for-fake-video-capture=${videoFile3}`,
                '--window-position=800,500',
                '--window-size=800,600',
            ],
        });

        user1 = await browserContext1.newPage();
        user2 = await browserContext2.newPage();
        user3 = await browserContext3.newPage();
    });

    test.afterEach(async () => {
        await browserContext1.close();
        await browserContext2.close();
        await browserContext3.close();
    });

    test('should establish a WebRTC call with simulated video feeds', async () => {
        await user1.goto(WEBRTC_TEST_URL);
        await user1.locator('input#usernameInput.swal2-input').fill('User 1');
        await user1.locator('.swal2-confirm').click();
        // first user gets a link sharing modal
        await user1.locator('.swal2-cancel').click();

        await user2.goto(WEBRTC_TEST_URL);
        await user2.locator('input#usernameInput.swal2-input').fill('User 2');
        await user2.locator('.swal2-confirm').click();

        await user3.goto(WEBRTC_TEST_URL);
        await user3.locator('input#usernameInput.swal2-input').fill('User 3');
        await user3.locator('.swal2-confirm').click();

        const waitForVideosToPlay = async (page: Page) => {
            await page.waitForFunction(
                () => {
                    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video'));
                    return (
                        // There is a hidden video for presumably technical reasons
                        videos.length >= 4 &&
                        videos.every(
                            (video, index) => index === 0 || video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA && !video.paused
                        )
                    );
                },
                { timeout: 20000 }
            );
        };

        await waitForVideosToPlay(user1);
        await waitForVideosToPlay(user2);
        await waitForVideosToPlay(user3);
    });
});
