import { runInAction } from "mobx";
import { UnwatchFn } from "@tauri-apps/plugin-fs";
import { listen } from "@tauri-apps/api/event";

import { TauriEvents } from "@lib/util/TauriEvents";
import { JsoncContainer, resolvePath } from "@lib/util/JsoncContainer";
import { SceneData } from "@lib/project/data";
import { ProjectDefinition, SceneDefinition, SceneManifest } from "../definition";
import { ProjectController } from "../ProjectController";
import { SceneDbRecord } from "../data/SceneDb";

export interface RawProjectScene {
  id: string;
  path: string;
  hash: string;
}

// EVENTS - INCOMING
// @NOTE These must match `SceneFsEvent` enum in: src/editor/src/app/src/filesystem/scenes.rs
/** Event from the backend specifying a scene has been created. */
export interface RawSceneCreatedEvent {
  create: {
    sceneId: string;
    path: string;
    hash: string;
  },
}
/** Event from the backend specifying a scene has been deleted. */
export interface RawSceneDeletedEvent {
  delete: {
    sceneId: string;
  },
}
/** Event from the backend specifying a scene has been modified. */
export interface RawSceneModifiedEvent {
  modify: {
    sceneId: string;
    newHash: string;
  },
}
/** Event from the backend specifying a scene has been renamed. */
export interface RawSceneRenamedEvent {
  rename: {
    sceneId: string;
    newPath: string;
  },
}
/** Any event from the backend for a scene. */
export type RawSceneEvent = RawSceneCreatedEvent | RawSceneDeletedEvent | RawSceneModifiedEvent | RawSceneRenamedEvent;


// EVENTS - OUTGOING
/** Type of scene event, for use by frontend eventing / notifying system (i.e. not from the backend). */
export enum ProjectSceneEventType {
  Create = "create",
  Delete = "delete",
  Modify = "modify",
  Rename = "rename",
}
/** Frontend event that a scene has been created. */
export interface ProjectSceneCreatedEvent {
  type: ProjectSceneEventType.Create;
  scene: SceneDbRecord;
}
/** Frontend event that a scene has been deleted. */
export interface ProjectSceneDeletedEvent {
  type: ProjectSceneEventType.Delete;
  scene: SceneDbRecord;
}
/** Frontend event that a scene has been modified. */
export interface ProjectSceneModifiedEvent {
  type: ProjectSceneEventType.Modify;
  scene: SceneDbRecord;
  oldHash: string;
}
/** Frontend event that a scene has been renamed. */
export interface ProjectSceneRenamedEvent {
  type: ProjectSceneEventType.Rename;
  scene: SceneDbRecord;
  oldPath: string;
}
/** Any frontend event that a scene has been updated. */
export type ProjectSceneEvent = ProjectSceneCreatedEvent | ProjectSceneDeletedEvent | ProjectSceneModifiedEvent | ProjectSceneRenamedEvent;

/** Callback function for scene events. */
export type ProjectSceneEventListener = (event: ProjectSceneEvent) => void;

export class ProjectScenesWatcher {
  private readonly projectController: ProjectController;
  private stopListeningForEvents: UnwatchFn | undefined = undefined;

  private readonly eventListeners: ProjectSceneEventListener[] = [];

  public constructor(projectController: ProjectController) {
    this.projectController = projectController;
  }

  public async startListening() {
    this.stopListeningForEvents = await listen<RawSceneEvent[]>(TauriEvents.OnProjectScenesUpdated, (e) => {
      void this.onProjectScenesUpdated(e.payload);
    });
  }

  public onSceneChanged(callback: ProjectSceneEventListener) {
    this.eventListeners.push(callback);

    // Unlisten function
    return () => {
      const listenerIndex = this.eventListeners.indexOf(callback);
      if (listenerIndex !== -1) {
        this.eventListeners.splice(listenerIndex, 1);
      }
    }
  }

  public onDestroy() {
    if (this.stopListeningForEvents) {
      this.stopListeningForEvents();
    }
  }

  private async onProjectScenesUpdated(updates: RawSceneEvent[]) {
    console.log(`[ProjectScenesWatcher] (onProjectScenesUpdated)`, updates);

    let eventPromises: Promise<ProjectSceneEvent>[] = [];
    for (const update of updates) {
      if ('create' in update) {
        eventPromises.push(this.applyCreate(update));
      } else if ('delete' in update) {
        eventPromises.push(this.applyDelete(update));
      } else if ('modify' in update) {
        eventPromises.push(this.applyModify(update));
      } else if ('rename' in update) {
        eventPromises.push(this.applyRename(update));
      }
    }

    const events = await Promise.all(eventPromises);

    // Notify all listeners of scene events
    for (const event of events) {
      for (const listener of this.eventListeners) {
        listener(event);
      }
    }

    // Ensure any mutations to the project file are written to disk
    void this.projectController.mutator.persistChanges();
  }

  private async applyCreate({ create: event }: RawSceneCreatedEvent): Promise<ProjectSceneCreatedEvent> {
    const { sceneId, path, hash } = event;
    const sceneDb = this.projectController.project.scenes;
    const fs = this.projectController.fileSystem;

    // 0. Read new scene data
    const file = await fs.readFile(path);
    const newSceneJson = new JsoncContainer<SceneDefinition>(file.textContent);

    return runInAction(() => {
      // 1. Update data
      console.log(`[ProjectScenesWatcher] (applyCreate) New scene: ${path} (${sceneId})`);
      const newSceneManifest: SceneManifest = {
        id: sceneId,
        path,
        hash,
      };
      const newSceneData = sceneDb.add(newSceneManifest, newSceneJson);

      // 2. Update JSON
      const jsonIndex = this.projectController.projectDefinition.value.scenes.length;
      let jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[jsonIndex]);
      this.projectController.projectDefinition.mutate(jsonPath, newSceneManifest, { isArrayInsertion: true });

      return {
        type: ProjectSceneEventType.Create,
        scene: newSceneData,
      };
    });
  }

  private async applyDelete({ delete: event }: RawSceneDeletedEvent): Promise<ProjectSceneDeletedEvent> {
    const { sceneId } = event;
    const sceneDb = this.projectController.project.scenes;

    return runInAction(() => {
      // 1. Update data
      const scene = sceneDb.getById(sceneId);
      if (scene === undefined) throw new Error(`Cannot apply 'Delete' event: No scene found in SceneDb with id: ${sceneId}`);
      console.log(`[ProjectScenesWatcher] (applyDelete) Scene deleted: ${scene.data.path}`);
      sceneDb.remove(sceneId);

      // 2. Update JSON
      const jsonIndex = this.projectController.projectDefinition.value.scenes.findIndex((scene) => scene.id === sceneId);
      if (jsonIndex === -1) throw new Error(`Cannot apply 'Delete' event: No scene found in ProjectDefinition with id: ${sceneId}`);
      let jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[jsonIndex]);
      this.projectController.projectDefinition.delete(jsonPath);

      return {
        type: ProjectSceneEventType.Delete,
        scene: scene,
      };
    });
  }

  private async applyModify({ modify: event }: RawSceneModifiedEvent): Promise<ProjectSceneModifiedEvent> {
    const { sceneId, newHash } = event;
    const assetDb = this.projectController.project.assets;
    const sceneDb = this.projectController.project.scenes;
    const fs = this.projectController.fileSystem;

    // 0. Read new scene data
    const scene = sceneDb.getById(sceneId);
    if (scene === undefined) throw new Error(`Cannot apply 'Modify' event: No scene found in SceneDb with id: ${sceneId}`);
    const file = await fs.readFile(scene.data.path);
    const newSceneJsonc = new JsoncContainer<SceneDefinition>(file.textContent);

    return runInAction(() => {
      // 1. Update data
      console.log(`[ProjectScenesWatcher] (applyModify) Scene modified: ${scene.data.path}`);
      // @NOTE Since we are replacing the record here, any consumers of the scene data will have
      // to manually opt-in to responding to this modify event, rather than being able to rely on any kind of MobX magic
      scene.jsonc = newSceneJsonc;
      scene.data = new SceneData(newSceneJsonc.value, scene.manifest, assetDb);
      const oldHash = scene.data.hash;
      scene.manifest.hash = newHash;
      scene.data.hash = newHash;

      // 2. Update JSON
      const jsonIndex = this.projectController.projectDefinition.value.scenes.findIndex((scene) => scene.id === sceneId);
      if (jsonIndex === -1) throw new Error(`Cannot apply 'Modify' event: No scene found in ProjectDefinition with id: ${sceneId}`);
      let jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[jsonIndex].hash);
      this.projectController.projectDefinition.mutate(jsonPath, newHash);

      return Promise.resolve({
        type: ProjectSceneEventType.Modify,
        scene,
        oldHash,
      });
    });
  }

  private applyRename({ rename: event }: RawSceneRenamedEvent): Promise<ProjectSceneRenamedEvent> {
    const { sceneId, newPath } = event;
    const sceneDb = this.projectController.project.scenes;

    // @NOTE For now (2024/12/30), Rename events guarantee that the contents are not changed.
    // If you rename a file AND modify it, the fs watcher will emit a Delete + Create
    // This is helpful in this instance because it means we don't have to re-scan the file

    return runInAction(() => {
      // 1. Update data
      const scene = sceneDb.getById(sceneId);
      if (scene === undefined) throw new Error(`Cannot apply 'Rename' event: No scene found in SceneDb with id: ${sceneId}`);
      console.log(`[ProjectScenesWatcher] (applyRename) Scene renamed: ${scene.data.path} -> ${newPath}`);
      const oldPath = scene.data.path;
      scene.data.path = newPath;
      scene.manifest.path = newPath;

      // 2. Update JSON
      const jsonIndex = this.projectController.projectDefinition.value.scenes.findIndex((scene) => scene.id === sceneId);
      if (jsonIndex === -1) throw new Error(`Cannot apply 'Rename' event: No scene found in ProjectDefinition with id: ${sceneId}`);
      let jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[jsonIndex].path);
      this.projectController.projectDefinition.mutate(jsonPath, newPath);

      return Promise.resolve({
        type: ProjectSceneEventType.Rename,
        scene: scene,
        oldPath,
      });
    });
  }
}