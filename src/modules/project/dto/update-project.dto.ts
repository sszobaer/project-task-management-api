import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Marketing Website Revamp v2' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated scope' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}
