import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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

  @Post('projects/:projectId/tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task inside a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Task created' })
  @ApiResponse({ status: 403, description: 'Access denied to project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.create(user.id, projectId, dto);
  }

  @Get('projects/:projectId/tasks')
  @ApiOperation({ summary: 'List tasks in a project with pagination and filtering' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['TODO', 'IN_PROGRESS', 'DONE'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @ApiResponse({ status: 200, description: 'Paginated task list' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: TaskQueryDto,
  ) {
    return this.taskService.findAll(user.id, projectId, query);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get a single task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.taskService.findOne(user.id, id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(user.id, id, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.taskService.remove(user.id, id);
  }
}
