// @ts-ignore
import pdfImgConvert from 'pdf-img-convert';

export class PdfHandler {
    /**
     * Intercepts browser download events and streams binary chunks directly into memory
     */
    static async processDownloadToBuffer(download: any): Promise<Buffer> {
        const pdfStream = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of pdfStream) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        return Buffer.concat(chunks);
    }

    /**
     * Rasterizes raw vector PDF buffers down into standardized 1200px PNG layers inside memory
     */
    static async convertPdfToPngBuffer(pdfBuffer: Buffer): Promise<Buffer> {
        const outputImages = await pdfImgConvert.convert(pdfBuffer, { 
            width: 1200 
        });
        
        const firstPageImage = outputImages[0];
        if (!firstPageImage) {
            throw new Error('PDF conversion engine failed to extract the first document page.');
        }
        
        return Buffer.from(firstPageImage);
    }
}
