import { VirtualFile } from '../types';
import { File } from '../models/File';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

export class VirtualFileSystem {
  private cache: Map<string, Map<string, VirtualFile>> = new Map();
  private workspaceRoot = '/workspace/projects';

  private getProjectPath(projectId: string): string {
    return path.join(this.workspaceRoot, projectId);
  }

  private async ensureProjectDirectory(projectId: string): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    await fs.mkdir(projectPath, { recursive: true });
  }

  private async writeToFilesystem(projectId: string, filePath: string, content: string): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    const fullPath = path.join(projectPath, filePath);
    const dirPath = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf8');
  }

  private async deleteFromFilesystem(projectId: string, filePath: string): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    const fullPath = path.join(projectPath, filePath);
    
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async loadProject(projectId: string): Promise<Map<string, VirtualFile>> {
    if (this.cache.has(projectId)) {
      return this.cache.get(projectId)!;
    }

    const files = await File.find({ 
      projectId: new mongoose.Types.ObjectId(projectId) 
    }).sort({ version: -1 });

    const fileMap = new Map<string, VirtualFile>();
    
    const latestFiles = new Map<string, any>();
    for (const file of files) {
      if (!latestFiles.has(file.path)) {
        latestFiles.set(file.path, file);
      }
    }

    for (const [path, file] of latestFiles) {
      fileMap.set(path, {
        id: file._id.toString(),
        projectId: file.projectId.toString(),
        path: file.path,
        content: file.content,
        version: file.version,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      });
    }

    this.cache.set(projectId, fileMap);
    return fileMap;
  }

  async createFile(
    projectId: string,
    path: string,
    content: string
  ): Promise<VirtualFile> {
    // Ensure project directory exists
    await this.ensureProjectDirectory(projectId);
    
    const fileDoc = await File.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      path,
      content,
      version: 1,
      metadata: {
        size: Buffer.byteLength(content, 'utf8'),
      },
    });

    // Write to filesystem
    await this.writeToFilesystem(projectId, path, content);

    const vFile: VirtualFile = {
      id: fileDoc._id.toString(),
      projectId: fileDoc.projectId.toString(),
      path: fileDoc.path,
      content: fileDoc.content,
      version: fileDoc.version,
      createdAt: fileDoc.createdAt,
      updatedAt: fileDoc.updatedAt,
    };

    const projectFiles = await this.loadProject(projectId);
    projectFiles.set(path, vFile);

    return vFile;
  }

  async updateFile(
    projectId: string,
    path: string,
    content: string,
    diff?: string
  ): Promise<VirtualFile> {
    const projectFiles = await this.loadProject(projectId);
    const existing = projectFiles.get(path);

    if (!existing) {
      return this.createFile(projectId, path, content);
    }

    const fileDoc = await File.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      path,
      content,
      version: existing.version + 1,
      diff,
      metadata: {
        size: Buffer.byteLength(content, 'utf8'),
      },
    });

    const vFile: VirtualFile = {
      id: fileDoc._id.toString(),
      projectId: fileDoc.projectId.toString(),
      path: fileDoc.path,
      content: fileDoc.content,
      version: fileDoc.version,
      createdAt: fileDoc.createdAt,
      updatedAt: fileDoc.updatedAt,
    };

    projectFiles.set(path, vFile);

    return vFile;
  }

  async deleteFile(projectId: string, path: string): Promise<void> {
    const projectFiles = await this.loadProject(projectId);
    projectFiles.delete(path);
  }

  async getFile(projectId: string, path: string): Promise<VirtualFile | null> {
    const projectFiles = await this.loadProject(projectId);
    return projectFiles.get(path) || null;
  }

  async listFiles(projectId: string): Promise<VirtualFile[]> {
    const projectFiles = await this.loadProject(projectId);
    return Array.from(projectFiles.values());
  }

  async getFileHistory(projectId: string, path: string): Promise<VirtualFile[]> {
    const files = await File.find({
      projectId: new mongoose.Types.ObjectId(projectId),
      path,
    }).sort({ version: -1 });

    return files.map(file => ({
      id: file._id.toString(),
      projectId: file.projectId.toString(),
      path: file.path,
      content: file.content,
      version: file.version,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));
  }

  clearCache(projectId?: string) {
    if (projectId) {
      this.cache.delete(projectId);
    } else {
      this.cache.clear();
    }
  }
}

export const vfs = new VirtualFileSystem();