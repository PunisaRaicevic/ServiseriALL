import PDFDocument from 'pdfkit';
import { storage } from './storage';

interface ReportData {
  taskDescription: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  applianceName?: string;
  applianceSerial?: string;
  applianceLocation?: string;
  reportDescription?: string;
  workDuration?: number;
  sparePartsUsed?: string;
  completedAt?: Date;
  technicianName?: string;
  photos?: string[];
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Failed to fetch image:', url, error);
    return null;
  }
}

export async function generateReportPdf(reportId: string): Promise<Buffer> {
  const report = await storage.getReport(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  const task = report.taskId ? await storage.getTask(report.taskId) : null;
  const client = task?.clientId ? await storage.getClient(task.clientId) : null;
  const appliance = task?.applianceId ? await storage.getAppliance(task.applianceId) : null;
  
  let technicianName: string | undefined;
  if (task?.userId) {
    const user = await storage.getUser(task.userId);
    technicianName = user?.fullName || user?.username;
  }

  const data: ReportData = {
    taskDescription: task?.description || 'N/A',
    clientName: client?.name || 'N/A',
    clientAddress: client?.address || undefined,
    clientPhone: client?.contactPhone || undefined,
    applianceName: appliance 
      ? [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ')
      : undefined,
    applianceSerial: appliance?.serial || undefined,
    applianceLocation: appliance 
      ? [appliance.city, appliance.building, appliance.room].filter(Boolean).join(' • ')
      : undefined,
    reportDescription: report.description,
    workDuration: report.workDuration || undefined,
    sparePartsUsed: report.sparePartsUsed || undefined,
    completedAt: task?.completedAt ? new Date(task.completedAt) : undefined,
    technicianName,
    photos: report.photos || undefined,
  };

  return createPdf(data);
}

async function createPdf(data: ReportData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Servisni Izvještaj',
          Author: 'Tehniko System',
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    const primaryColor = '#1a365d';
    const accentColor = '#3182ce';
    const lightGray = '#f7fafc';
    const textGray = '#4a5568';

    doc.save();
    doc.fontSize(72).font('Helvetica-Bold').fillColor('#e2e8f0').opacity(0.15);
    doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
    doc.text('TEHNIKO', pageWidth / 2 - 150, pageHeight / 2 - 20);
    doc.restore();

    doc.rect(0, 0, pageWidth, 100).fill(primaryColor);
    
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('SERVISNI IZVJEŠTAJ', margin, 35, { align: 'center', width: contentWidth });
    
    if (data.completedAt) {
      doc.fontSize(11).font('Helvetica').fillColor('#e2e8f0');
      doc.text(
        data.completedAt.toLocaleDateString('sr-Latn-RS', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        margin, 65, { align: 'center', width: contentWidth }
      );
    }

    let yPos = 120;

    doc.rect(margin, yPos, contentWidth, 80).fill(lightGray).stroke('#e2e8f0');
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('KLIJENT', margin + 15, yPos + 12);
    
    doc.fontSize(10).font('Helvetica').fillColor(textGray);
    doc.text(data.clientName, margin + 15, yPos + 30);
    if (data.clientAddress) doc.text(data.clientAddress, margin + 15, yPos + 45);
    if (data.clientPhone) doc.text(`Tel: ${data.clientPhone}`, margin + 15, yPos + 60);

    yPos += 95;

    if (data.applianceName) {
      doc.rect(margin, yPos, contentWidth, 80).fill(lightGray).stroke('#e2e8f0');
      
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('UREĐAJ', margin + 15, yPos + 12);
      
      doc.fontSize(10).font('Helvetica').fillColor(textGray);
      doc.text(data.applianceName, margin + 15, yPos + 30);
      if (data.applianceSerial) doc.text(`S/N: ${data.applianceSerial}`, margin + 15, yPos + 45);
      if (data.applianceLocation) doc.text(`Lokacija: ${data.applianceLocation}`, margin + 15, yPos + 60);
      
      yPos += 95;
    }

    doc.rect(margin, yPos, contentWidth, 50).fill(accentColor);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('ZADATAK', margin + 15, yPos + 12);
    doc.fontSize(10).font('Helvetica').fillColor('#ffffff');
    doc.text(data.taskDescription, margin + 15, yPos + 30, { width: contentWidth - 30 });
    
    yPos += 65;

    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('IZVJEŠTAJ O RADU', margin, yPos);
    yPos += 20;
    
    doc.moveTo(margin, yPos).lineTo(margin + contentWidth, yPos).strokeColor(accentColor).lineWidth(2).stroke();
    yPos += 15;

    doc.fontSize(10).font('Helvetica').fillColor(textGray);
    
    if (data.reportDescription) {
      doc.text(data.reportDescription, margin, yPos, { width: contentWidth });
      yPos = doc.y + 15;
    }

    if (data.workDuration || data.sparePartsUsed) {
      doc.rect(margin, yPos, contentWidth, data.sparePartsUsed ? 50 : 30).fill(lightGray);
      
      if (data.workDuration) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
        doc.text('Trajanje rada: ', margin + 15, yPos + 10, { continued: true });
        doc.font('Helvetica').fillColor(textGray);
        doc.text(`${data.workDuration} minuta`);
      }

      if (data.sparePartsUsed) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
        doc.text('Utrošeni dijelovi: ', margin + 15, yPos + (data.workDuration ? 30 : 10), { continued: true });
        doc.font('Helvetica').fillColor(textGray);
        doc.text(data.sparePartsUsed);
      }
      
      yPos += data.sparePartsUsed ? 60 : 40;
    }

    if (data.photos && data.photos.length > 0) {
      yPos += 10;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('FOTOGRAFIJE', margin, yPos);
      yPos += 20;
      
      doc.moveTo(margin, yPos).lineTo(margin + contentWidth, yPos).strokeColor(accentColor).lineWidth(2).stroke();
      yPos += 15;

      const imageSize = 120;
      const imagesPerRow = 3;
      const spacing = (contentWidth - (imageSize * imagesPerRow)) / (imagesPerRow + 1);
      
      let currentRow = 0;
      let currentCol = 0;
      let photosBaseY = yPos;
      
      for (let i = 0; i < Math.min(data.photos.length, 6); i++) {
        const photoUrl = data.photos[i];
        const imageBuffer = await fetchImageBuffer(photoUrl);
        
        if (imageBuffer) {
          const xPos = margin + spacing + (currentCol * (imageSize + spacing));
          let imgYPos = photosBaseY + (currentRow * (imageSize + 10));
          
          if (imgYPos + imageSize > pageHeight - 100) {
            doc.addPage();
            photosBaseY = 50;
            currentRow = 0;
            imgYPos = photosBaseY;
          }
          
          try {
            doc.image(imageBuffer, xPos, imgYPos, { 
              width: imageSize, 
              height: imageSize, 
              fit: [imageSize, imageSize],
              align: 'center',
              valign: 'center'
            });
            doc.rect(xPos, imgYPos, imageSize, imageSize).strokeColor('#e2e8f0').lineWidth(1).stroke();
          } catch (imgError) {
            console.error('Failed to add image to PDF:', imgError);
          }
          
          currentCol++;
          if (currentCol >= imagesPerRow) {
            currentCol = 0;
            currentRow++;
          }
        }
      }
      
      const totalRows = currentCol > 0 ? currentRow + 1 : currentRow;
      yPos = photosBaseY + (totalRows * (imageSize + 10)) + 10;
    }

    const signatureY = Math.max(yPos + 30, pageHeight - 150);
    
    if (signatureY > pageHeight - 100) {
      doc.addPage();
    }
    
    const finalY = signatureY > pageHeight - 100 ? 50 : signatureY;
    
    doc.moveTo(margin, finalY).lineTo(margin + 200, finalY).strokeColor(textGray).lineWidth(0.5).stroke();
    doc.fontSize(9).font('Helvetica').fillColor(textGray);
    if (data.technicianName) {
      doc.text(`Tehničar: ${data.technicianName}`, margin, finalY + 5);
    } else {
      doc.text('Potpis tehničara', margin, finalY + 5);
    }

    doc.moveTo(margin + 295, finalY).lineTo(margin + contentWidth, finalY).strokeColor(textGray).lineWidth(0.5).stroke();
    doc.text('Potpis klijenta', margin + 295, finalY + 5);

      doc.fontSize(8).font('Helvetica').fillColor('#a0aec0');
      doc.text(
        'Ovaj dokument je automatski generisan putem Tehniko System aplikacije.',
        margin, pageHeight - 40,
        { align: 'center', width: contentWidth }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
