import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project } from 'generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a project — ownerId is always taken from the JWT user
  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: { ...dto, ownerId: userId },
    });
    return this.toSafeProject(project);
  }

  // Get all projects the user owns or participates in (paginated + searchable)
  async findAll(userId: string, query: ProjectQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { ownerId: userId },
        {
          tasks: {
            some: {
              assignedToId: userId,
            },
          },
        },
      ],
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map(this.toSafeProject),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  // Get a single project — owner or any assigned participant
  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');

    await this.verifyParticipantAccess(userId, project);

    return this.toSafeProject(project);
  }


  // Update a project — owner only, ownerId cannot be changed
  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
    return this.toSafeProject(updated);
  }

  // Delete a project — owner only; tasks are cascade-deleted
  async remove(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.project.delete({ where: { id: projectId } });
    return { message: 'Project deleted successfully' };
  }

  // Throws if the user is not the owner or an assignee in this project
  private async verifyParticipantAccess(userId: string, project: Project) {
    if (project.ownerId === userId) return;

    const hasTask = await this.prisma.task.findFirst({
      where: {
        projectId: project.id,
        assignedToId: userId,
      },
      select: { id: true },
    });

    if (!hasTask) throw new ForbiddenException('Access denied');
  }

  // Strip internal fields before returning project data
  private toSafeProject(project: Project) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
