import { Vector3 } from '@babylonjs/core';
import { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Unzipped, unzip } from 'fflate';

import type { MeshComponent } from './world/components/MeshComponent';

export const CARTRIDGE_MANIFEST_FILENAME = 'manifest.json';

// @TODO split into separate files under `cartridge/` and re-export through index.ts

/**
 * A loaded game Cartridge, containing all the data for the entire game.
 */
export class Cartridge {
  public scenes: SceneConfig[];
  public files: VirtualFileSystem;

  public constructor(scenes: SceneConfig[], files: VirtualFileSystem) {
    this.scenes = scenes;
    this.files = files;
  }
}

/**
 * Files that live on a cartridge.
 */
export class VirtualFileSystem {
  private files: VirtualFile[];

  public constructor(files: VirtualFile[]) {
    this.files = files;
  }

  /**
   * Get a file by its virtual path.
   * @param path The virtual file path of the file to get.
   * @returns {} {@link VirtualFile} if one exists at `path`, `undefined` otherwise.
   */
  public tryGetByPath(path: string): VirtualFile | undefined {
    // @NOTE lo-fi canonicalisation hack using `decodeURIComponent`
    // Trim leading slashes from path
    let canonical = decodeURIComponent(new URL(path, "https://foo.bar").pathname).replace(/^\//, '');
    return this.files.find((file) => file.path === canonical);
  }

  /**
   * Get a file by its ID. Throws an error if no file exists with `id`.
   * @param id The ID of the file to get.
   * @param expectedType (Optional) Validation parameter. The expected type of this {@link VirtualFile}. An error will be thrown if the type does not match.
   * @throws If no file exists with `id`
   */
  public getById(id: number, expectedType: VirtualFileType | undefined = undefined): VirtualFile {
    const file = this.files.find((file) => file.id === id);
    if (!file) {
      throw new Error(`No file found with id: ${id}`);
    }
    if (expectedType !== undefined && file.type !== expectedType) {
      throw new Error(`File has incorrect type. Expected ${expectedType}. ${file}`);
    }
    return file;
  }

  public [Symbol.iterator](): Iterator<VirtualFile> {
    return this.files[Symbol.iterator]();
  }
}

export enum VirtualFileType {
  Model = 0,
  Texture = 1,
  Script = 2,
}

/**
 * A file in a {@link Cartridge}'s {@link VirtualFileSystem}.
 */
// @TODO should we subclass this instead of using `type` ?
export class VirtualFile {
  /** Unique ID for this file. */
  public readonly id: number;
  /** Type of this file (e.g. Script, Model, etc.) */
  public readonly type: VirtualFileType;
  /** Virtual path of this file. */
  public readonly path: string;
  /** Raw bytes of this file. */
  public readonly bytes: ArrayBuffer;
  /**
   * "Object URL" that can be used to fetch this file. Created with `URL.createObjectURL()`.
   */
  public readonly url: string;

  public constructor(id: number, type: VirtualFileType, path: string, bytes: Uint8Array) {
    this.id = id;
    this.type = type;
    this.path = path;
    this.bytes = bytes;
    // @NOTE create blob URLs for all files in the Virtual FS
    this.url = URL.createObjectURL(new Blob([bytes]));
  }

  public toString(): string {
    return `VirtualFile(${this.id}, ${this.type}, ${this.path})`;
  }

  /**
   * File extension of this file. Includes the dot e.g. `.txt`.
   * Returns empty string if file has no extension.
   */
  public get extension(): string {
    let match = /\.[^.]+$/.exec(this.path);
    if (match === null) {
      return '';
    } else {
      return match[0];
    }
  }
}

/**
 * A game scene "configuration" i.e. loaded from the raw cartridge file
 * but not yet loaded into the game. Think of it like a template.
 */
export class SceneConfig {
  public id: number;
  public objects: GameObjectConfig[];

  public constructor(id: number, objects: GameObjectConfig[]) {
    this.id = id;
    this.objects = objects;
  }
}

/**
 * Preconfigured GameObject i.e. a GameObject loaded from the raw cartridge file
 * but not yet loaded into the game. Think of it like a template (Unity's "Prefabs", Unreal's "Blueprints", Godot's "Scenes", etc.)
 */
export class GameObjectConfig {
  public id: number;
  public position: Vector3;
  public rotation: number; // @TODO expressed as a 1D angle for now
  public components: ComponentConfig[];

  public constructor(id: number, position: Vector3, rotation: number, components: ComponentConfig[]) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.components = components;
  }
}

/**
 * Configuration data for a GameObjectComponent.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export abstract class ComponentConfig {

}

/**
 * Configuration data for a {@link MeshComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class MeshComponentConfig extends ComponentConfig {
  /**
   * {@link VirtualFile} containing the mesh asset.
   */
  public meshFile: VirtualFile;
  public constructor(meshFile: VirtualFile) {
    super();

    // Validate
    if (meshFile.type !== VirtualFileType.Model) {
      throw new Error(`Cannot construct MeshComponent from non-model file ${meshFile}`);
    }

    this.meshFile = meshFile;
  }
}

/**
 * Configuration data for a custom component script written by the user.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class ScriptComponentConfig extends ComponentConfig {
  /**
   * {@link VirtualFile} containing the script asset.
   */
  public scriptFile: VirtualFile;
  public constructor(scriptFile: VirtualFile) {
    super();

    // Validate
    if (scriptFile.type !== VirtualFileType.Script) {
      throw new Error(`Cannot construct ScriptComponent from non-script file ${scriptFile}`);
    }

    this.scriptFile = scriptFile;
  }
}

/**
 * The raw archive file of a {@link Cartridge}.
 */
export class CartridgeArchive {
  private unzippedData: Unzipped;

  public constructor(unzippedData: Unzipped) {
    this.unzippedData = unzippedData;
  }

  /**
   * The cartridge manifest defining all the data of the game.
   */
  public get manifest(): CartridgeArchiveManifest {
    let manifestBytes = this.unzippedData[CARTRIDGE_MANIFEST_FILENAME];
    return JSON.parse(new TextDecoder().decode(manifestBytes));
  }

  /**
   * Get the bytes of a {@link VirtualFile} inside this archive.
   * @param path Virtual file path of the file to get.
   * @returns Bytes of virtual file.
   */
  public getFile(path: string): Uint8Array {
    let fileBytes = this.unzippedData[path];
    if (!fileBytes) {
      throw new Error(`No file found at path: '${path}'`);
    }
    return fileBytes;
  }

  /**
   * Construct a {@link VirtualFileSystem} from a set of references to files within this archive.
   * @param fileReferences Array of file references to include in the {@link VirtualFileSystem}
   */
  public createVirtualFileSystem(fileReferences: CartridgeArchiveFileReference[]): VirtualFileSystem {
    let files = fileReferences.map((fileReference) => {
      let fileBytes = this.getFile(fileReference.path);
      return new VirtualFile(fileReference.id, fileReference.type as VirtualFileType, fileReference.path, fileBytes);
    });
    return new VirtualFileSystem(files);
  }
}

/**
 * The raw manifest of a {@link CartridgeArchive} containing all the content in the Cartridge.
 * i.e. the definition of the Cartridge on-disk, before being loaded by the engine.
 */
export interface CartridgeArchiveManifest {
  scenes: SceneDefinition[];
  files: CartridgeArchiveFileReference[];
}

/**
 * Raw reference to a virtual file in a {@link CartridgeArchive}.
 * i.e. A pointer to a virtual file, before being loaded by the engine.
 */
export interface CartridgeArchiveFileReference {
  id: number;
  type: VirtualFileType;
  path: string;
}

/**
 * Raw game scene definition within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link SceneConfig}.
 */
export interface SceneDefinition {
  id: number;
  objects: SceneObjectDefinition[];
}

/**
 * Raw game object data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link GameObjectConfig}.
 */
export interface SceneObjectDefinition {
  id: number;
  position: IVector3Like;
  rotation: number;
  components: ComponentDefinition[];
}

export enum ComponentDefinitionType {
  Mesh = 0,
  Script = 1,
}

/**
 * Raw game object component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link ComponentConfig}.
 */
export interface ComponentDefinition {
  type: ComponentDefinitionType;
}

/**
 * Raw mesh component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link MeshComponentConfig}.
 */
export interface MeshComponentDefinition extends ComponentDefinition {
  meshFileId: number;
}

/**
 * Raw script component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link ScriptComponentConfig}.
 */
export interface ScriptComponentDefinition extends ComponentDefinition {
  scriptFileId: number;
}

/**
 * Fetch and parse a {@link CartridgeArchive} file from a URL.
 * @param url URL for the cartridge archive file
 */
export async function fetchCartridge(url: string): Promise<CartridgeArchive> {
  const response = await fetch(url);
  const cartridgeBytes = await response.arrayBuffer();
  console.log(`Got cartridge data: ${Math.round(cartridgeBytes.byteLength / 1024)}kb`);

  const cartridgeData = await new Promise<Unzipped>((resolve, reject) => {
    unzip(new Uint8Array(cartridgeBytes), (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  return new CartridgeArchive(cartridgeData);
}

/**
 * Load raw data defined in a {@link CartridgeArchive} into a usable format that
 * can be loaded into the game.
 * @param cartridgeArchive {@link CartridgeArchive} file to load.
 */
export async function loadCartridge(cartridgeArchive: CartridgeArchive): Promise<Cartridge> {
  const cartridgeDefinition = cartridgeArchive.manifest;

  // Read the files in the manifest into a virtual file system from cartridge archive data
  const fileSystem = cartridgeArchive.createVirtualFileSystem(cartridgeDefinition.files);

  // Build cartridge from definition
  const scenes: SceneConfig[] = [];
  for (let sceneDefinition of cartridgeDefinition.scenes) {
    const objects: GameObjectConfig[] = [];
    for (let objectDefinition of sceneDefinition.objects) {
      let components: ComponentConfig[] = [];
      for (let componentDefinition of objectDefinition.components) {
        switch (componentDefinition.type) {
          case ComponentDefinitionType.Mesh: {
            const meshComponentDefinition = componentDefinition as MeshComponentDefinition;
            const meshFile = fileSystem.getById(meshComponentDefinition.meshFileId, VirtualFileType.Model);
            components.push(new MeshComponentConfig(meshFile));
            break;
          }
          case ComponentDefinitionType.Script: {
            const scriptComponentDefinition = componentDefinition as ScriptComponentDefinition;
            const scriptFile = fileSystem.getById(scriptComponentDefinition.scriptFileId, VirtualFileType.Script);
            components.push(new ScriptComponentConfig(scriptFile));
            break;
          }
          default: {
            throw new Error(`Unknown component type: ${componentDefinition.type}`);
          }
        }
      }

      let position = new Vector3(objectDefinition.position.x, objectDefinition.position.y, objectDefinition.position.z);
      objects.push(new GameObjectConfig(objectDefinition.id, position, objectDefinition.rotation, components));
    }

    scenes.push(new SceneConfig(sceneDefinition.id, objects));
  }

  return new Cartridge(scenes, fileSystem);
}
