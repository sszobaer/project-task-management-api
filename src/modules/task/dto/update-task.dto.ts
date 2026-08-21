import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from 'generated/prisma';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus, { message: 'status must be TODO, IN_PROGRESS, or DONE' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority, { message: 'priority must be LOW, MEDIUM, or HIGH' })
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsUUID('4', { message: 'assignedToId must be a valid UUID' })
  @IsOptional()
  assignedToId?: string;
}
