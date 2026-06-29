import { Page } from '@playwright/test';

export class NetworkHelper {
    /**
     * Intercepts network traffic to block trackers, ads, and heavy media,
     * maximizing pipeline throughput and preventing cloud test timeouts.
     */
    static async optimizeThroughput(page: Page): Promise<void> {
        await page.route('**/*', (route) => {
            const url = route.request().url();
            const type = route.request().resourceType();

            if (
                url.includes('analytics') ||
                url.includes('doubleclick') ||
                url.includes('ads') ||
                type === 'image' ||
                type === 'media'
            ) {
                route.abort();
            } else {
                route.continue();
            }
        });
        console.log('Network Infrastructure Helper: Tracking and media filters initialized.');
    }
}
