import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project } from 'generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: { ...dto, ownerId: userId },
    });
    return this.toSafeProject(project);
  }

  async findAll(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return projects.map(this.toSafeProject);
  }

  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');

    return this.toSafeProject(project);
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
    return this.toSafeProject(updated);
  }

  async remove(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.project.delete({ where: { id: projectId } });
    return { message: 'Project deleted successfully' };
  }

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
