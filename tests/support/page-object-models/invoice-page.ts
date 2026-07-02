import { Page, Locator, expect } from '@playwright/test';
import { DocumentItem } from '../../document-datasets';

export class InvoicePage {
    private readonly page: Page;
    private readonly invoiceNumberInput: Locator;
    private readonly companyFromInput: Locator;
    private readonly companyToInput: Locator;
    private readonly dateInput: Locator;
    private readonly addItemButton: Locator;
    private readonly balanceDueDisplay: Locator;
    private readonly downloadButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.invoiceNumberInput = page.locator('.subtitle input');
        this.companyFromInput = page.locator('[placeholder="Who is this from?"]');
        this.companyToInput = page.locator('[placeholder="Who is this to?"]');
        this.dateInput = page.locator('input.datepicker.date, input.hasDatepicker');
        this.addItemButton = page.locator('button:has-text("Line Item")');
        this.balanceDueDisplay = page.getByText('$').nth(5);
        this.downloadButton = page.locator('button:has-text("Download")');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/');
        console.log('Navigated to the invoice generator application.');
    }

    async fillHeaderData(invoiceNumber: string, companyFrom: string, companyTo: string): Promise<void> {
        await this.invoiceNumberInput.fill(invoiceNumber);
        await this.companyFromInput.fill(companyFrom);
        await this.companyToInput.fill(companyTo);
        console.log(`Filled in invoice header data for ${invoiceNumber}`);
    }

    async selectInvoiceDate(invoiceDate: string): Promise<void> {
        const dateParts = invoiceDate.split('-');
        if (dateParts.length !== 3) {
            throw new Error(`invoiceDate format mismatch (expected YYYY-MM-DD): ${invoiceDate}`);
        }
        const [year, month, day] = dateParts.map(Number) as [number, number, number];

        await this.dateInput.first().click();
        await this.page.locator('select.ui-datepicker-year').selectOption(String(year));
        await this.page.locator('select.ui-datepicker-month').selectOption(String(month - 1));
        await this.page.locator('table.ui-datepicker-calendar td[data-handler="selectDay"] a', {
            hasText: String(day)
        }).first().click();

        console.log(`Selected invoice date: ${invoiceDate}`);
    }

    async populateLineItems(items: DocumentItem[]): Promise<void> {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item) {
                throw new Error(`Missing invoice item data at index ${i}.`);
            }

            const itemRows = this.page.locator('.item-row');
            const currentRowCount = await itemRows.count();

            if (i >= currentRowCount) {
                await this.addItemButton.first().click();
                await this.page.locator('.item-row').nth(i).waitFor({ state: 'visible' });
            }

            const itemRow = this.page.locator('.item-row').nth(i);
            await itemRow.getByPlaceholder('Description of item/service...').fill(item.description);
            await itemRow.locator('.quantity input').fill(item.quantity);
            await itemRow.locator('.unit_cost input').fill(item.unitCost);

            console.log(`Added invoice item ${i + 1}: ${item.description}`);
        }
    }

    async verifyBalanceDue(expectedTotal: string): Promise<void> {
        await expect(this.balanceDueDisplay).toContainText(expectedTotal);
        console.log(`Verified balance due matches expected total: ${expectedTotal}`);
    }

    async downloadDocument(): Promise<any> {
        const downloadPromise = this.page.waitForEvent('download');
        await this.downloadButton.first().click();
        return await downloadPromise;
    }
}
