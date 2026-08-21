import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project, Task } from 'generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a task — owner only
  async create(userId: string, projectId: string, dto: CreateTaskDto) {
    const project = await this.verifyOwnerAccess(userId, projectId);

    if (dto.assignedToId) {
      await this.verifyUserExists(dto.assignedToId);
    }

    const task = await this.prisma.task.create({
      data: { ...dto, projectId: project.id },
    });
    return this.toSafeTask(task);
  }

  // Get all tasks in a project  owner sees all, participant sees only their own
  async findAll(userId: string, projectId: string, query: TaskQueryDto) {
    const project = await this.verifyParticipantAccess(userId, projectId);

    const { page = 1, limit = 10, status, priority, search } = query;
    const skip = (page - 1) * limit;

    const isOwner = project.ownerId === userId;

    const where = {
      projectId,
      ...(!isOwner && { assignedToId: userId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map(this.toSafeTask),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get a single task — owner or the task's assigned user
  async findOne(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId },
    });

    if (!task) throw new NotFoundException('Task not found');

    await this.verifyTaskReadAccess(userId, task);

    return this.toSafeTask(task);
  }

  // Update a task — owner or the task's assigned user; only owner may reassign
  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId },
    });

    if (!task) throw new NotFoundException('Task not found');

    const project = await this.verifyTaskWriteAccess(userId, task);
    const isOwner = project.ownerId === userId;

    // Only the project owner may change assignedToId
    if (dto.assignedToId !== undefined) {
      if (!isOwner) {
        throw new ForbiddenException('Only the project owner may reassign tasks');
      }
      if (dto.assignedToId !== null) {
        await this.verifyUserExists(dto.assignedToId);
      }
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: dto,
    });
    return this.toSafeTask(updated);
  }

  // Delete a task — owner only
  async remove(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId },
    });

    if (!task) throw new NotFoundException('Task not found');

    await this.verifyOwnerAccess(userId, task.projectId);

    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: 'Task deleted successfully' };
  }

  // Get all tasks assigned to the current user (from JWT)
  async assignedToMe(userId: string, query: TaskQueryDto) {
    const { page = 1, limit = 10, status, priority, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      assignedToId: userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map(this.toSafeTask),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Throws if the user is not the project owner
  private async verifyOwnerAccess(userId: string, projectId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');

    return project;
  }

  // Throws if the user is not the owner or at least one task assignee in the project
  private async verifyParticipantAccess(userId: string, projectId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.ownerId === userId) return project;

    const hasTask = await this.prisma.task.findFirst({
      where: {
        projectId,
        assignedToId: userId,
      },
      select: { id: true },
    });

    if (!hasTask) throw new ForbiddenException('Access denied');

    return project;
  }

  // Throws if the user is not the owner or this task's assignee (read)
  private async verifyTaskReadAccess(userId: string, task: Task): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: task.projectId },
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.ownerId === userId) return;
    if (task.assignedToId === userId) return;

    throw new ForbiddenException('Access denied');
  }

  // Throws if the user is not the owner or this task's assignee (write)
  private async verifyTaskWriteAccess(userId: string, task: Task): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id: task.projectId },
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.ownerId === userId) return project;
    if (task.assignedToId === userId) return project;

    throw new ForbiddenException('Access denied');
  }

  // Throws if the user does not exist
  private async verifyUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Assigned user not found');
  }

  // Strip internal fields before returning task data
  private toSafeTask(task: Task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      assignedToId: task.assignedToId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
