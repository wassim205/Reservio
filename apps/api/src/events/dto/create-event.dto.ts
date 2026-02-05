import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsPositive,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';

// DTO for creating a new event (admin only)
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsInt()
  @IsPositive()
  capacity: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
