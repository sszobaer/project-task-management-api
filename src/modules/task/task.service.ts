import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Task } from 'generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, projectId: string, dto: CreateTaskDto) {
    await this.verifyProjectAccess(userId, projectId);

    if (dto.assignedToId) {
      await this.verifyUserExists(dto.assignedToId);
    }

    const task = await this.prisma.task.create({
      data: { ...dto, projectId },
    });
    return this.toSafeTask(task);
  }

  async findAll(userId: string, projectId: string, query: TaskQueryDto) {
    await this.verifyProjectAccess(userId, projectId);

    const { page = 1, limit = 10, status, priority } = query;
    const skip = (page - 1) * limit;

    const where = {
      projectId,
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
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
      tasks: tasks.map(this.toSafeTask),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Task not found');

    await this.verifyProjectAccess(userId, task.projectId);

    return this.toSafeTask(task);
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Task not found');

    await this.verifyProjectAccess(userId, task.projectId);

    if (dto.assignedToId) {
      await this.verifyUserExists(dto.assignedToId);
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: dto,
    });
    return this.toSafeTask(updated);
  }

  async remove(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Task not found');

    await this.verifyProjectAccess(userId, task.projectId);

    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: 'Task deleted successfully' };
  }

  private async verifyProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');

    return project;
  }

  private async verifyUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Assigned user not found');
  }

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
