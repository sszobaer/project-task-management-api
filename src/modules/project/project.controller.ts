import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectService } from './project.service';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  // POST /projects — create a new project
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto) {
    return this.projectService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List projects accessible to the authenticated user',
    description:
      'Returns projects that the user owns OR participates in via task assignment.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by project name (partial, case-insensitive)' })
  @ApiResponse({ status: 200, description: 'Paginated list of owned and participated projects' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  // GET /projects — list all accessible projects with pagination and search
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ProjectQueryDto) {
    return this.projectService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single project by ID',
    description:
      'Accessible by the project owner or any user assigned to a task in the project (participant).',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Access denied — not an owner or participant' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  // GET /projects/:id — get a project by ID (owner or participant)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.projectService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a project (owner only)',
    description: 'Supports partial updates. Only the project owner may update. ownerId cannot be changed.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Access denied — only the project owner may update' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  // PATCH /projects/:id — partial update (owner only)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a project and all its tasks (owner only)',
    description:
      'Only the project owner may delete. Tasks are cascade-deleted via the database relation.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Access denied — only the project owner may delete' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  // DELETE /projects/:id — delete project and cascade-delete its tasks (owner only)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.projectService.remove(user.id, id);
  }
}
