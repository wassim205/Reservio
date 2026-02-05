import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient, Event, EventStatus, Prisma } from '@prisma/client';
import { CreateEventDto, UpdateEventDto } from './dto';

@Injectable()
export class EventsService {
  private prisma = new PrismaClient();

  // Create a new event (defaults to DRAFT status)
  async create(createEventDto: CreateEventDto, adminId: string): Promise<Event> {
    // Validate dates
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    return this.prisma.event.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description,
        location: createEventDto.location,
        startDate,
        endDate,
        capacity: createEventDto.capacity,
        metadata: createEventDto.metadata as Prisma.InputJsonValue | undefined,
        createdById: adminId,
        status: EventStatus.DRAFT,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
    });
  }

  // Get all events (with optional status filter)
  async findAll(status?: EventStatus): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: status ? { status } : undefined,
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  // Get only published events (for participants)
  async findPublished(): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  // Get a single event by ID
  async findOne(id: string): Promise<Event> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  // Update an event (only if DRAFT)
  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    // Only allow editing draft events
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot edit a published or cancelled event',
      );
    }

    // Validate dates if provided
    const startDate = updateEventDto.startDate
      ? new Date(updateEventDto.startDate)
      : event.startDate;
    const endDate = updateEventDto.endDate
      ? new Date(updateEventDto.endDate)
      : event.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(updateEventDto.title && { title: updateEventDto.title }),
        ...(updateEventDto.description && {
          description: updateEventDto.description,
        }),
        ...(updateEventDto.location && { location: updateEventDto.location }),
        ...(updateEventDto.startDate && { startDate }),
        ...(updateEventDto.endDate && { endDate }),
        ...(updateEventDto.capacity && { capacity: updateEventDto.capacity }),
        ...(updateEventDto.metadata !== undefined && {
          metadata: updateEventDto.metadata as Prisma.InputJsonValue,
        }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
    });
  }

  // Publish an event (DRAFT -> PUBLISHED)
  async publish(id: string): Promise<Event> {
    const event = await this.findOne(id);

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be published');
    }

    // Validate event is in the future
    if (event.startDate < new Date()) {
      throw new BadRequestException(
        'Cannot publish an event with a past start date',
      );
    }

    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
    });
  }

  // Cancel an event (DRAFT or PUBLISHED -> CANCELLED)
  async cancel(id: string): Promise<Event> {
    const event = await this.findOne(id);

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Event is already cancelled');
    }

    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.CANCELLED },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
    });
  }

  // Delete an event (only if DRAFT or CANCELLED)
  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);

    if (event.status === EventStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot delete a published event. Cancel it first.',
      );
    }

    await this.prisma.event.delete({ where: { id } });
  }
}
