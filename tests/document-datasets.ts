export interface DocumentItem {
  description: string;
  quantity: string;
  unitCost: string;
  total?: string;
}

export interface DocumentTestCase {
  scenarioName: string;
  invoiceNumber: string;
  invoiceDate: string;
  companyFrom: string;
  companyTo: string;
  items: DocumentItem[];
  expectedTotal: string;
  baselineSnapshotName: string;
}

export const internationalTestCases: DocumentTestCase[] = [
  {
    scenarioName: 'Standard US Transaction with Formatting',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '2026-06-23',
    companyFrom: 'North American Logistics LLC',
    companyTo: 'ACME Corporate Industries Inc.',
    items: [
      {
        description: 'Standard Product A',
        quantity: '5',
        unitCost: '1250.00',
        total: '$6,250.00'
      }
    ],
    expectedTotal: '$6,250.00',
    baselineSnapshotName: 'invoice-pdf-standard-us'
  },
  {
    scenarioName: 'European Multi-Currency & Long String Boundary Check',
    invoiceNumber: 'EUR-9941-X',
    invoiceDate: '2026-06-24',
    companyFrom: 'Gesellschaft für Kraftfahrzeugüberwachung mbH', // Tests string wrapping lines
    companyTo: 'EuroTrade Import-Export SAS',
    items: [
      {
        description: 'European Product B',
        quantity: '14',
        unitCost: '85.50',
        total: '$1,197.00'
      },
      {
        description: 'Additional Shipping Component',
        quantity: '2',
        unitCost: '100.00',
        total: '$200.00'
      }
    ],
    expectedTotal: '$1,397.00',
    baselineSnapshotName: 'invoice-pdf-euro-wrapping'
  }
];
