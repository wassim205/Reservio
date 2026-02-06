/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

/**
 * Interface for ticket data used in PDF generation
 */
interface TicketData {
  registrationId: string;
  participantName: string;
  participantEmail: string;
  eventTitle: string;
  eventLocation: string;
  eventStartDate: Date;
  eventEndDate: Date;
  confirmedAt: Date;
}

@Injectable()
export class TicketsService {
  private prisma = new PrismaClient();

  /**
   * Get ticket data for a registration
   * Business rules:
   * - Registration must exist
   * - Registration must belong to the requesting user
   * - Registration must be CONFIRMED
   */
  async getTicketData(
    registrationId: string,
    userId: string,
  ): Promise<TicketData> {
    // 1. Find registration with related data
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
            location: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // 2. Check registration exists
    if (!registration) {
      throw new NotFoundException(
        `Registration with ID ${registrationId} not found`,
      );
    }

    // 3. Check ownership - only the participant can download their ticket
    if (registration.userId !== userId) {
      throw new ForbiddenException(
        'You can only download tickets for your own registrations',
      );
    }

    // 4. Check registration is confirmed
    if (registration.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Ticket is only available for confirmed registrations',
      );
    }

    return {
      registrationId: registration.id,
      participantName: registration.user.fullname,
      participantEmail: registration.user.email,
      eventTitle: registration.event.title,
      eventLocation: registration.event.location,
      eventStartDate: registration.event.startDate,
      eventEndDate: registration.event.endDate,
      confirmedAt: registration.updatedAt,
    };
  }

  /**
   * Generate a PDF ticket for a confirmed registration
   * Returns a Buffer containing the PDF data
   */
  async generateTicketPdf(
    registrationId: string,
    userId: string,
  ): Promise<Buffer> {
    // Get and validate ticket data
    const ticketData = await this.getTicketData(registrationId, userId);

    // Generate PDF
    return this.createPdfBuffer(ticketData);
  }

  /**
   * Create PDF buffer from ticket data
   */
  private createPdfBuffer(ticketData: TicketData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Build the PDF content
      this.buildTicketContent(doc, ticketData);

      // Finalize the PDF
      doc.end();
    });
  }

  /**
   * Build the visual content of the ticket PDF
   */
  private buildTicketContent(doc: any, ticketData: TicketData): void {
    const pageWidth = doc.page.width - 100; // Account for margins

    // Header with logo/title
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text('RESERVIO', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(18)
      .font('Helvetica')
      .fillColor('#374151')
      .text('Ticket de Confirmation', { align: 'center' });

    doc.moveDown(2);

    // Ticket border box
    const boxTop = doc.y;
    const boxHeight = 280;

    doc
      .strokeColor('#e5e7eb')
      .lineWidth(2)
      .roundedRect(50, boxTop, pageWidth, boxHeight, 10)
      .stroke();

    doc.y = boxTop + 20;

    // Event Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text(ticketData.eventTitle, 70, doc.y, {
        width: pageWidth - 40,
        align: 'center',
      });

    doc.moveDown(1.5);

    // Event Details Section
    const leftColumn = 70;
    const labelWidth = 100;

    // Location
    this.addDetailRow(
      doc,
      'Lieu:',
      ticketData.eventLocation,
      leftColumn,
      labelWidth,
    );

    // Date
    const dateStr = this.formatDateRange(
      ticketData.eventStartDate,
      ticketData.eventEndDate,
    );
    this.addDetailRow(doc, 'Date:', dateStr, leftColumn, labelWidth);

    doc.moveDown(1);

    // Separator line
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(70, doc.y)
      .lineTo(pageWidth + 30, doc.y)
      .stroke();

    doc.moveDown(1);

    // Participant Details
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#6b7280')
      .text('PARTICIPANT', leftColumn);

    doc.moveDown(0.5);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text(ticketData.participantName, leftColumn);

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(ticketData.participantEmail, leftColumn);

    // Move below the box
    doc.y = boxTop + boxHeight + 30;

    // Ticket Reference
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(`Référence: ${ticketData.registrationId}`, { align: 'center' });

    doc.moveDown(0.3);

    doc.text(`Confirmé le: ${this.formatDate(ticketData.confirmedAt)}`, {
      align: 'center',
    });

    doc.moveDown(3);

    // Footer
    doc
      .fontSize(10)
      .fillColor('#9ca3af')
      .text('Ce ticket est personnel et non transférable.', {
        align: 'center',
      });

    doc.text("Veuillez le présenter à l'entrée de l'événement.", {
      align: 'center',
    });
  }

  /**
   * Add a label-value row to the PDF
   */
  private addDetailRow(
    doc: any,
    label: string,
    value: string,
    x: number,
    labelWidth: number,
  ): void {
    const y = doc.y;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#6b7280')
      .text(label, x, y, { width: labelWidth, continued: false });

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#111827')
      .text(value, x + labelWidth, y);

    doc.moveDown(0.8);
  }

  /**
   * Format a date range for display
   */
  private formatDateRange(startDate: Date, endDate: Date): string {
    const start = this.formatDate(startDate);
    const startTime = this.formatTime(startDate);
    const endTime = this.formatTime(endDate);

    // Check if same day
    const sameDay = startDate.toDateString() === endDate.toDateString();

    if (sameDay) {
      return `${start} de ${startTime} à ${endTime}`;
    }

    const end = this.formatDate(endDate);
    return `Du ${start} ${startTime} au ${end} ${endTime}`;
  }

  /**
   * Format a date for display (French format)
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format time for display
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
