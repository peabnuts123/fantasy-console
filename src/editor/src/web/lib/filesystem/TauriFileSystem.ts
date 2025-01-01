import { convertFileSrc } from '@tauri-apps/api/core';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { action, computed, makeAutoObservable, makeObservable, observable, runInAction } from 'mobx';

import { IFileSystem, VirtualFile } from "@fantasy-console/runtime/src/filesystem";

/**
 * Minimum amount of time the FS will stay in the 'Writing' state for,
 * to make sure the UI doesn't flicker.
 */
const MinimumWritingStatusDurationMs = 500;

export enum WritingState {
  Writing,
  UpToDate,
  Failed,
}

// @TODO Eventing like onFinishSave or whatever so that fs events can wait until
// finished saving.
// + Also maybe some way to disable saving

export class TauriFileSystem extends IFileSystem {
  private readonly projectRootDir: string;
  private _writingState: WritingState = WritingState.UpToDate;

  public constructor(projectRootDir: string) {
    super(`pzedfs`);
    this.projectRootDir = projectRootDir;

    // @NOTE List of private property names, so that MobX can reference them
    type PrivateProperties = '_writingState' | 'projectRootDir';
    makeObservable<TauriFileSystem, PrivateProperties>(this, {
      '_writingState': observable,
      'writingState': computed,
      'projectRootDir': observable,
      'getUrlForPath': action,
      'readFile': action,
      'writeFile': action,
    });
  }

  public getUrlForPath(path: string): string {
    return convertFileSrc(`${this.projectRootDir}/${path}`);
  }

  public async readFile(path: string): Promise<VirtualFile> {
    const fileBytes = await readFile(`${this.projectRootDir}/${path}`)
    return new VirtualFile(fileBytes);
  }

  public async writeFile(path: string, data: Uint8Array): Promise<void> {
    this.writingState = WritingState.Writing;
    const startWriteTime = performance.now();
    try {
      await writeFile(`${this.projectRootDir}/${path}`, data);

      const writingDuration = performance.now() - startWriteTime;
      const waitTime = Math.max(MinimumWritingStatusDurationMs - writingDuration, 0);
      setTimeout(() => {
        runInAction(() => {
          this.writingState = WritingState.UpToDate;
        });
      }, waitTime);
    } catch (e) {
      runInAction(() => {
        this.writingState = WritingState.Failed;
      })
      console.error(`Failed to write file: `, e);
      throw e;
    }
  }

  public get writingState(): WritingState {
    return this._writingState;
  }
  private set writingState(value: WritingState) {
    this._writingState = value;
  }
}