import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Marketing Website Revamp' })
  @IsString()
  @IsNotEmpty({ message: 'Project name is required' })
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Redesign of the public marketing site' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}
