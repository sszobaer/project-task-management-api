import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from 'generated/prisma';

export class CreateTaskDto {
  @ApiProperty({ example: 'Design homepage hero section' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ example: 'Create three concept directions' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsEnum(TaskStatus, { message: 'status must be TODO, IN_PROGRESS, or DONE' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority, { message: 'priority must be LOW, MEDIUM, or HIGH' })
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsUUID('4', { message: 'assignedToId must be a valid UUID' })
  @IsOptional()
  assignedToId?: string;
}
