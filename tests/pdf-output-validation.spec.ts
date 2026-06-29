import { test, expect } from '@playwright/test';
import { NetworkHelper } from './support/helpers/network-helper'; // <-- Add import
import { PdfHandler } from './support/helpers/pdf-handler';
import { internationalTestCases } from './document-datasets';

test.describe('Enterprise Business Output Document Automation Pipeline - Matrix Execution', () => {

    for (const dataBlock of internationalTestCases) {

        test(`Data-Driven Lifecycle Validation: ${dataBlock.scenarioName}`, async ({ page }) => {

            // Network filtering abstracted helper layer
            await NetworkHelper.optimizeThroughput(page);

            // ------------------------------------------------------------------------
            // 1: NAVIGATE TO THE WEB-BASED DOCUMENT GENERATOR AND FILL IN MOCK DATA
            // ------------------------------------------------------------------------
            await page.goto('https://invoice-generator.com');
            console.log(`Navigated to the invoice generator web application for scenario: ${dataBlock.scenarioName}`);

            const invoiceNumberInput = page.locator('.subtitle input');
            await invoiceNumberInput.fill(dataBlock.invoiceNumber);
            console.log(`Filled in invoice number: ${dataBlock.invoiceNumber}`);

            const companyFromInput = page.locator('[placeholder="Who is this from?"]');
            await companyFromInput.fill(dataBlock.companyFrom);
            console.log(`Filled in company from: ${dataBlock.companyFrom}`);

            const companyToInput = page.locator('[placeholder="Who is this to?"]');
            await companyToInput.fill(dataBlock.companyTo);
            console.log(`Filled in company to: ${dataBlock.companyTo}`);

            const dateParts = dataBlock.invoiceDate.split('-');
            if (dateParts.length !== 3) {
                throw new Error(`invoiceDate must be in YYYY-MM-DD format: ${dataBlock.invoiceDate}`);
            }
            const [invoiceYear, invoiceMonth, invoiceDay] = dateParts.map(Number) as [number, number, number];
            const dateInput = page.locator('input.datepicker.date, input.hasDatepicker').first();
            await dateInput.click();
            await page.locator('select.ui-datepicker-year').selectOption(String(invoiceYear));
            await page.locator('select.ui-datepicker-month').selectOption(String(invoiceMonth - 1));
            await page.locator('table.ui-datepicker-calendar td[data-handler="selectDay"] a', {
                hasText: String(invoiceDay)
            }).first().click();
            console.log(`Selected invoice date: ${dataBlock.invoiceDate}`);

            const items = dataBlock.items;
            const addItemButton = page.locator('button:has-text("Line Item")');

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!item) {
                    throw new Error(`Missing invoice item data at index ${i}.`);
                }

                const itemRows = page.locator('.item-row');
                const currentRowCount = await itemRows.count();

                if (i >= currentRowCount) {
                    if (await addItemButton.count() > 0) {
                        await addItemButton.first().click();
                        await page.locator('.item-row').nth(i).waitFor({ state: 'visible' });
                    } else {
                        throw new Error(`Invoice page does not expose the Line Item button for item index ${i}.`);
                    }
                }

                const itemRow = page.locator('.item-row').nth(i);
                const nameInput = itemRow.getByPlaceholder('Description of item/service...');
                await nameInput.fill(item.description);
                console.log(`Filled in item description: ${item.description}`);

                const quantityInput = itemRow.locator('.quantity input');
                await quantityInput.fill(item.quantity);
                console.log(`Filled in item quantity: ${item.quantity}`);

                const costInput = itemRow.locator('.unit_cost input');
                await costInput.fill(item.unitCost);
                console.log(`Filled in item unit cost: ${item.unitCost}`);
            }

            const balanceDueValue = page.getByText('$').nth(5);
            await expect(balanceDueValue).toContainText(dataBlock.expectedTotal);
            console.log(`Verified Balance Due: $${dataBlock.expectedTotal}`);

            // ------------------------------------------------------------------------
            // 2: DOWNLOAD THE ACTUAL FILE TARGET
            // ------------------------------------------------------------------------
            const downloadPromise = page.waitForEvent('download');
            await page.locator('button:has-text("Download")').first().click();
            const download = await downloadPromise;

            // Stream downloaded file chunks cleanly straight into memory bytes
            const pdfBuffer = await PdfHandler.processDownloadToBuffer(download);
            console.log(`Successfully intercepted download and buffered binary stream.`);

            // ------------------------------------------------------------------------
            // 3: CONVERT BUFFER NATIVELY TO PNG & VISUALLY VALIDATE
            // ------------------------------------------------------------------------

            // Render page 1 of the PDF directly to a pure PNG image buffer
            const firstPageImageBuffer = await PdfHandler.convertPdfToPngBuffer(pdfBuffer);

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
