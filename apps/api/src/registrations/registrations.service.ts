import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaClient,
  Registration,
  RegistrationStatus,
  EventStatus,
} from '@prisma/client';

@Injectable()
export class RegistrationsService {
  private prisma = new PrismaClient();

  /**
   * Create a reservation request (Participant action)
   * Business rules:
   * - Event must exist
   * - Event must be PUBLISHED (not DRAFT or CANCELLED)
   * - Event must not be full (remaining seats > 0)
   * - User must not already have an active registration (PENDING or CONFIRMED)
   */
  async create(eventId: string, userId: string): Promise<Registration> {
    // 1. Check event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // 2. Check event is published
    if (event.status !== EventStatus.PUBLISHED) {
      if (event.status === EventStatus.CANCELLED) {
        throw new BadRequestException('Cannot register for a cancelled event');
      }
      throw new BadRequestException(
        'Cannot register for an event that is not published',
      );
    }

    // 3. Check event is not in the past
    if (event.endDate < new Date()) {
      throw new BadRequestException('Cannot register for a past event');
    }

    // 4. Check user doesn't already have an active registration
    const existingRegistration = await this.prisma.registration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    if (existingRegistration) {
      if (existingRegistration.status === RegistrationStatus.PENDING) {
        throw new ConflictException(
          'You already have a pending reservation for this event',
        );
      }
      if (existingRegistration.status === RegistrationStatus.CONFIRMED) {
        throw new ConflictException(
          'You already have a confirmed reservation for this event',
        );
      }
      // If CANCELLED, allow re-registering by updating the existing record
      return this.prisma.registration.update({
        where: { id: existingRegistration.id },
        data: { status: RegistrationStatus.PENDING },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              location: true,
            },
          },
          user: {
            select: {
              id: true,
              fullname: true,
              email: true,
            },
          },
        },
      });
    }

    // 5. Check capacity (count active registrations: PENDING + CONFIRMED)
    const activeRegistrations = await this.prisma.registration.count({
      where: {
        eventId,
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
        },
      },
    });

    if (activeRegistrations >= event.capacity) {
      throw new BadRequestException(
        'This event is fully booked. No seats remaining.',
      );
    }

    // 6. Create the registration with PENDING status
    return this.prisma.registration.create({
      data: {
        userId,
        eventId,
        status: RegistrationStatus.PENDING,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Cancel own reservation (Participant action)
   */
  async cancelOwn(
    registrationId: string,
    userId: string,
  ): Promise<Registration> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.userId !== userId) {
      throw new BadRequestException(
        'You can only cancel your own reservations',
      );
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('This reservation is already cancelled');
    }

    return this.prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.CANCELLED },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get user's registrations (Participant action)
   */
  async findByUser(userId: string): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============ ADMIN METHODS ============

  async findByEvent(eventId: string): Promise<Registration[]> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return this.prisma.registration.findMany({
      where: { eventId },
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
            id: true,
            title: true,
            startDate: true,
            location: true,
            capacity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirm(registrationId: string): Promise<Registration> {
    return this.prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: { event: true },
      });

      if (!registration) {
        throw new NotFoundException('Registration not found');
      }

      if (registration.status === RegistrationStatus.CONFIRMED) {
        throw new BadRequestException('Registration is already confirmed');
      }

      if (registration.status === RegistrationStatus.CANCELLED) {
        throw new BadRequestException(
          'Cannot confirm a cancelled registration',
        );
      }

      const confirmedCount = await tx.registration.count({
        where: {
          eventId: registration.eventId,
          status: RegistrationStatus.CONFIRMED,
        },
      });

      if (confirmedCount >= registration.event.capacity) {
        throw new BadRequestException('Event is at full capacity');
      }

      return tx.registration.update({
        where: { id: registrationId },
        data: { status: RegistrationStatus.CONFIRMED },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              location: true,
            },
          },
          user: {
            select: {
              id: true,
              fullname: true,
              email: true,
            },
          },
        },
      });
    });
  }

  async reject(registrationId: string): Promise<Registration> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('This registration is already cancelled');
    }

    return this.prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.CANCELLED },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
    });
  }
}
