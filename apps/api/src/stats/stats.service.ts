import { Injectable } from '@nestjs/common';
import { PrismaClient, EventStatus } from '@prisma/client';

/**
 * Interface for admin statistics response
 */
export interface AdminStats {
  // Event statistics
  events: {
    total: number;
    upcoming: number;
    published: number;
    draft: number;
    cancelled: number;
  };
  // Registration statistics
  registrations: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  // Fill rate statistics
  fillRate: {
    averagePercentage: number;
    totalCapacity: number;
    totalConfirmed: number;
  };
  // Top events by registrations
  topEvents: Array<{
    id: string;
    title: string;
    capacity: number;
    confirmedCount: number;
    fillPercentage: number;
  }>;
}

@Injectable()
export class StatsService {
  private prisma = new PrismaClient();

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    const now = new Date();

    // Get event counts by status
    const [
      totalEvents,
      upcomingEvents,
      publishedEvents,
      draftEvents,
      cancelledEvents,
    ] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.count({
        where: {
          startDate: { gte: now },
          status: EventStatus.PUBLISHED,
        },
      }),
      this.prisma.event.count({
        where: { status: EventStatus.PUBLISHED },
      }),
      this.prisma.event.count({
        where: { status: EventStatus.DRAFT },
      }),
      this.prisma.event.count({
        where: { status: EventStatus.CANCELLED },
      }),
    ]);

    // Get registration counts by status
    const [
      totalRegistrations,
      pendingRegistrations,
      confirmedRegistrations,
      cancelledRegistrations,
    ] = await Promise.all([
      this.prisma.registration.count(),
      this.prisma.registration.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.registration.count({
        where: { status: 'CONFIRMED' },
      }),
      this.prisma.registration.count({
        where: { status: 'CANCELLED' },
      }),
    ]);

    // Calculate fill rate for published events
    const publishedEventsWithCapacity = await this.prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        capacity: true,
        registrations: {
          where: { status: 'CONFIRMED' },
          select: { id: true },
        },
      },
    });

    const totalCapacity = publishedEventsWithCapacity.reduce(
      (sum, event) => sum + event.capacity,
      0,
    );
    const totalConfirmed = publishedEventsWithCapacity.reduce(
      (sum, event) => sum + event.registrations.length,
      0,
    );
    const averageFillRate =
      totalCapacity > 0 ? (totalConfirmed / totalCapacity) * 100 : 0;

    // Get top 5 events by registration count
    const topEvents = publishedEventsWithCapacity
      .map((event) => ({
        id: event.id,
        title: event.title,
        capacity: event.capacity,
        confirmedCount: event.registrations.length,
        fillPercentage:
          event.capacity > 0
            ? Math.round((event.registrations.length / event.capacity) * 100)
            : 0,
      }))
      .sort((a, b) => b.confirmedCount - a.confirmedCount)
      .slice(0, 5);

    return {
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        published: publishedEvents,
        draft: draftEvents,
        cancelled: cancelledEvents,
      },
      registrations: {
        total: totalRegistrations,
        pending: pendingRegistrations,
        confirmed: confirmedRegistrations,
        cancelled: cancelledRegistrations,
      },
      fillRate: {
        averagePercentage: Math.round(averageFillRate * 10) / 10,
        totalCapacity,
        totalConfirmed,
      },
      topEvents,
    };
  }
}
