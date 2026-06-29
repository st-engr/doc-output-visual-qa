import { test, expect } from '@playwright/test';
import { NetworkHelper } from './support/helpers/network-helper';
import { PdfHandler } from './support/helpers/pdf-handler';
import { InvoicePage } from './support/page-object-models/invoice-page';
import { internationalTestCases } from './document-datasets';

test.describe('Enterprise Business Output Document Automation Pipeline - Matrix Execution', () => {

    for (const dataBlock of internationalTestCases) {

        test(`Data-Driven Lifecycle Validation: ${dataBlock.scenarioName}`, async ({ page }) => {

            // 1. Initialize Network Optimization Infrastructures via Helpers
            await NetworkHelper.optimizeThroughput(page);

            // 2. Initialize Core Page Object Model Actions
            const invoicePage = new InvoicePage(page);

            // 3. Orchestrate Web Form Lifecycle Matrix Data Entries
            await invoicePage.navigate();
            await invoicePage.fillHeaderData(dataBlock.invoiceNumber, dataBlock.companyFrom, dataBlock.companyTo);
            await invoicePage.selectInvoiceDate(dataBlock.invoiceDate);
            await invoicePage.populateLineItems(dataBlock.items);
            await invoicePage.verifyBalanceDue(dataBlock.expectedTotal);

            // 4. Trigger and Intercept Document Outputs via Buffers
            const downloadArtifact = await invoicePage.downloadDocument();
            const pdfFileBuffer = await PdfHandler.processDownloadToBuffer(downloadArtifact);
            console.log(`Successfully intercepted download and buffered binary stream.`);

            // 5. Convert Memory Bytes and Assert Layout Snapshots
            const firstPageImageBuffer = await PdfHandler.convertPdfToPngBuffer(pdfFileBuffer);

            // Attach layout image into the Playwright Test report for viewing
            await test.info().attach(`Rendered PDF Document - ${dataBlock.invoiceNumber}`, {
                body: firstPageImageBuffer,
                contentType: 'image/png'
            });

            // Absolute strict validation against true baseline document snapshot
            expect(firstPageImageBuffer).toMatchSnapshot(`${dataBlock.baselineSnapshotName}.png`, {
                maxDiffPixelRatio: 0,
                maxDiffPixels: 0,
            });
        });
    }
});
