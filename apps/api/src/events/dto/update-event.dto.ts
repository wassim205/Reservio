import {
  IsString,
  IsDateString,
  IsInt,
  IsPositive,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';

// DTO for updating an existing event (admin only)
// All fields are optional - only provided fields will be updated
export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
