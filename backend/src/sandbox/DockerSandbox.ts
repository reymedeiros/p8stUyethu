import Dockerode from 'dockerode';
import { SandboxConfig, SandboxResult, ExecutionLog } from '../types';
import config from '../config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';

export class DockerSandbox {
  private docker: Dockerode;

  constructor() {
    this.docker = new Dockerode({ socketPath: config.docker.socketPath });
  }

  async execute(sandboxConfig: SandboxConfig): Promise<SandboxResult> {
    const containerId = `sandbox-${sandboxConfig.projectId}-${uuidv4().slice(0, 8)}`;
    const logs: ExecutionLog[] = [];
    let container: Dockerode.Container | null = null;

    try {
      const workDir = `/tmp/${containerId}`;
      await fs.mkdir(workDir, { recursive: true });

      for (const [filePath, content] of sandboxConfig.files) {
        const fullPath = path.join(workDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
      }

      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Created ${sandboxConfig.files.size} files in ${workDir}`,
      });

      const image = 'node:18-alpine';
      await this.ensureImage(image);

      container = await this.docker.createContainer({
        Image: image,
        name: containerId,
        Cmd: sandboxConfig.command ? ['/bin/sh', '-c', sandboxConfig.command] : ['/bin/sh'],
        WorkingDir: '/workspace',
        Env: Object.entries(sandboxConfig.env || {}).map(([k, v]) => `${k}=${v}`),
        HostConfig: {
          Binds: [`${workDir}:/workspace`],
          Memory: this.parseMemoryLimit(config.docker.sandbox.memoryLimit),
          NanoCpus: config.docker.sandbox.cpuLimit * 1e9,
          NetworkMode: 'none',
          AutoRemove: true,
        },
      });

      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Container ${containerId} created`,
      });

      await container.start();

      logs.push({
        timestamp: new Date(),
        level: 'success',
        message: 'Container started',
      });

      const result = await container.wait({ condition: 'not-running' });
      const logsStream = await container.logs({
        stdout: true,
        stderr: true,
        follow: false,
      });

      const output = logsStream.toString();
      const [stdout, stderr] = this.splitOutput(output);

      await fs.rm(workDir, { recursive: true, force: true });

      logs.push({
        timestamp: new Date(),
        level: result.StatusCode === 0 ? 'success' : 'error',
        message: `Container exited with code ${result.StatusCode}`,
      });

      return {
        exitCode: result.StatusCode || 0,
        stdout,
        stderr,
        logs,
      };
    } catch (error: any) {
      logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Sandbox error: ${error.message}`,
      });

      if (container) {
        try {
          await container.stop({ t: 1 });
          await container.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      return {
        exitCode: 1,
        stdout: '',
        stderr: error.message,
        logs,
      };
    }
  }

  private async ensureImage(image: string): Promise<void> {
    try {
      await this.docker.getImage(image).inspect();
    } catch (error) {
      console.log(`Pulling image ${image}...`);
      await new Promise((resolve, reject) => {
        this.docker.pull(image, (err: any, stream: any) => {
          if (err) return reject(err);
          this.docker.modem.followProgress(stream, (err: any) => {
            if (err) return reject(err);
            resolve(null);
          });
        });
      });
    }
  }

  private parseMemoryLimit(limit: string): number {
    const match = limit.match(/^(\d+)([kmg]?)$/i);
    if (!match) return 512 * 1024 * 1024;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'k': return value * 1024;
      case 'm': return value * 1024 * 1024;
      case 'g': return value * 1024 * 1024 * 1024;
      default: return value;
    }
  }

  private splitOutput(output: string): [string, string] {
    const lines = output.split('\n');
    const stdout: string[] = [];
    const stderr: string[] = [];

    for (const line of lines) {
      if (line.includes('ERROR') || line.includes('Error')) {
        stderr.push(line);
      } else {
        stdout.push(line);
      }
    }

    return [stdout.join('\n'), stderr.join('\n')];
  }

  async listContainers(): Promise<any[]> {
    return this.docker.listContainers({ all: true });
  }

  async stopContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.stop({ t: 1 });
    await container.remove();
  }
}

export const dockerSandbox = new DockerSandbox();