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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // ---------------------------------------------------------------------------
  // Project-scoped task endpoints
  // ---------------------------------------------------------------------------

  @Post('projects/:projectId/tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task inside a project (owner only)' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Authenticated user is not the project owner' })
  @ApiResponse({ status: 404, description: 'Project not found or assigned user not found' })
  // POST /projects/:projectId/tasks — create a task (owner only)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.create(user.id, projectId, dto);
  }

  @Get('projects/:projectId/tasks')
  @ApiOperation({
    summary: 'List tasks in a project with pagination and filtering',
    description:
      'Owner sees all tasks. Participants (assigned users) see only their own assigned tasks.',
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by task title (partial, case-insensitive)' })
  @ApiQuery({ name: 'status', required: false, enum: ['TODO', 'IN_PROGRESS', 'DONE'], description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Filter by priority' })
  @ApiResponse({ status: 200, description: 'Paginated task list' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  // GET /projects/:projectId/tasks — list tasks (owner: all; participant: own only)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: TaskQueryDto,
  ) {
    return this.taskService.findAll(user.id, projectId, query);
  }


  @Get('tasks/assigned-to-me')
  @ApiOperation({
    summary: 'Get all tasks assigned to the authenticated user',
    description:
      'Returns tasks where assignedToId matches the JWT user. ' +
      'Supports pagination, search, and filtering by status and priority.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by task title (partial, case-insensitive)' })
  @ApiQuery({ name: 'status', required: false, enum: ['TODO', 'IN_PROGRESS', 'DONE'], description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Filter by priority' })
  @ApiResponse({ status: 200, description: 'Paginated list of tasks assigned to the current user' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  // GET /tasks/assigned-to-me — list tasks assigned to the JWT user
  assignedToMe(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TaskQueryDto,
  ) {
    return this.taskService.assignedToMe(user.id, query);
  }

  @Get('tasks/:id')
  @ApiOperation({
    summary: 'Get a single task by ID',
    description: 'Accessible by the project owner or the assigned user (participant).',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  // GET /tasks/:id — get a task by ID (owner or that task's assignee)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.findOne(user.id, id);
  }

  @Patch('tasks/:id')
  @ApiOperation({
    summary: 'Update a task',
    description:
      'Accessible by the project owner or the assigned user (participant). ' +
      'Only the owner may reassign tasks to other users.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found or assigned user not found' })
  // PATCH /tasks/:id — update a task (owner or that task's assignee; only owner may reassign)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(user.id, id, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({
    summary: 'Delete a task (owner only)',
    description: 'Only the project owner may delete tasks.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Access denied — only the project owner may delete tasks' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  // DELETE /tasks/:id — delete a task (owner only)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.remove(user.id, id);
  }
}
