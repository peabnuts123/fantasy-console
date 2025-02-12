import { UnwatchFn } from "@tauri-apps/plugin-fs";
import { listen } from "@tauri-apps/api/event";

import { TauriEvents } from "@lib/util/TauriEvents";
import { ProjectController } from "../ProjectController";
import { ProjectData } from "../data/ProjectData";


// EVENTS - INCOMING
// @NOTE These must match `ProjectFsEvent` enum in: src/editor/src/app/src/filesystem/project.rs
// @NOTE Project file has no "Create" event
/** Event from the backend specifying the project file has been deleted. */
export interface RawProjectFileDeletedEvent {
  delete: object,
}
/** Event from the backend specifying the project file has been modified. */
export interface RawProjectFileModifiedEvent {
  modify: {
    newHash: string; // @NOTE Primarily used only by backend
  },
}
/** Event from the backend specifying the project file has been renamed. */
export interface RawProjectFileRenamedEvent {
  rename: {
    newPath: string;
  },
}
/** Any event from the backend for the project file. */
export type RawProjectFileEvent = RawProjectFileDeletedEvent | RawProjectFileModifiedEvent | RawProjectFileRenamedEvent;


// EVENTS - OUTGOING
/** Type of project file event, for use by frontend eventing / notifying system (i.e. not from the backend). */
export enum ProjectFileEventType {
  Delete = "delete",
  Modify = "modify",
  Rename = "rename",
}
// @NOTE Project file has no "Create" event
/** Frontend event that the project file has been deleted. */
export interface ProjectFileDeletedEvent {
  type: ProjectFileEventType.Delete;
}
/** Frontend event that the project file has been modified. */
export interface ProjectFileModifiedEvent {
  type: ProjectFileEventType.Modify;
  project: ProjectData;
}
/** Frontend event that the project file has been renamed. */
export interface ProjectFileRenamedEvent {
  type: ProjectFileEventType.Rename;
  project: ProjectData;
  oldPath: string;
}
/** Any frontend event that the project file has been updated. */
export type ProjectFileEvent = ProjectFileDeletedEvent | ProjectFileModifiedEvent | ProjectFileRenamedEvent;

/** Callback function for project file events. */
export type ProjectFileEventListener = (event: ProjectFileEvent) => void;

export class ProjectFileWatcher {
  private readonly projectController: ProjectController;
  private stopListeningForEvents: UnwatchFn | undefined = undefined;

  private readonly eventListeners: ProjectFileEventListener[] = [];

  public constructor(projectController: ProjectController) {
    this.projectController = projectController;
  }

  public async startListening(): Promise<void> {
    this.stopListeningForEvents = await listen<RawProjectFileEvent[]>(TauriEvents.OnProjectFileUpdated, (e) => {
      void this.onProjectFileUpdated(e.payload);
    });
  }

  public onProjectFileChanged(callback: ProjectFileEventListener) {
    this.eventListeners.push(callback);

    // Unlisten function
    return () => {
      const listenerIndex = this.eventListeners.indexOf(callback);
      if (listenerIndex !== -1) {
        this.eventListeners.splice(listenerIndex, 1);
      }
    };
  }

  public onDestroy(): void {
    if (this.stopListeningForEvents) {
      this.stopListeningForEvents();
    }
  }

  private async onProjectFileUpdated(updates: RawProjectFileEvent[]): Promise<void> {
    console.log(`[ProjectFileWatcher] (onProjectFileUpdated)`, updates);

    const eventPromises: Promise<ProjectFileEvent>[] = [];
    for (const update of updates) {
      // @NOTE Project file has no "Create" event
      if ('delete' in update) {
        eventPromises.push(this.applyDelete(update));
      } else if ('modify' in update) {
        eventPromises.push(this.applyModify(update));
      } else if ('rename' in update) {
        eventPromises.push(this.applyRename(update));
      }
    }

    const events = await Promise.all(eventPromises);

    // Notify all listeners of events
    for (const event of events) {
      for (const listener of this.eventListeners) {
        listener(event);
      }
    }

    // Ensure any mutations to the project file are written to disk
    void this.projectController.mutator.persistChanges();
  }

  private applyDelete({ delete: event }: RawProjectFileDeletedEvent): Promise<ProjectFileDeletedEvent> {
    const { /* @NOTE No props. */ } = event;

    return Promise.resolve({
      type: ProjectFileEventType.Delete,
    });
  }

  private async applyModify({ modify: event }: RawProjectFileModifiedEvent): Promise<ProjectFileModifiedEvent> {
    const { /* @NOTE No USED props. */ } = event;

    const newProject = await this.projectController.reloadProjectFileFromFs();
    return {
      type: ProjectFileEventType.Modify,
      project: newProject,
    };
  }

  private applyRename({ rename: event }: RawProjectFileRenamedEvent): Promise<ProjectFileRenamedEvent> {
    const { newPath } = event;

    const oldPath = this.projectController.project.fileName;
    this.projectController.project.fileName = newPath;

    return Promise.resolve({
      type: ProjectFileEventType.Rename,
      project: this.projectController.project,
      oldPath,
    });
  }
}
