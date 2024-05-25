// import * as GameEngine from './engine';
// import { GameObject } from './engine';
import * as Core from '@fantasy-console/core';
import { JsEngineObject, GameObject } from '@fantasy-console/core';

const MAGIC_PREFIX = `cartridge/scripts/`;

interface ModuleDefinition {
  id: string;
  dependencies: string[];
  getter: Function;
}

type Module = any;

const moduleDefinitions: Record<string, ModuleDefinition> = {};
const modulesBeingLoaded: Record<string, ModuleDefinition> = {};
const moduleCache: Record<string, Module> = {};

// Magic module definitions
moduleCache['@fantasy-console/core'] = Core;
moduleCache['require'] = () => { throw new Error(`Nested require is not supported, it should not be necessary`) };

export function load_module(path: string, source: string) {
  let moduleId = pathToModuleId(path);
  if (moduleDefinitions[moduleId] !== undefined) {
    // @TODO just no-op / warn
    throw new Error(`Tried to load duplicate module: ${path}`)
  }

  let moduleDefinition: ModuleDefinition = undefined!;
  new Function('define', `"use strict";${source}`)(defineModule.bind(undefined, (result) => {
    moduleDefinition = result;
  }));

  if (moduleDefinition === undefined) {
    throw new Error("Defining module did not produce a result");
  } else {
    moduleDefinition.id = moduleId;
    console.log(`Loaded module '${moduleId}' (from path: '${path}')`, moduleDefinition);
    moduleDefinitions[moduleId] = moduleDefinition;
  }
}

export function bind_script_to_game_object(engineObject: JsEngineObject, scriptPath: string): GameObject {
  let moduleId = pathToModuleId(scriptPath);
  let module = getModule(moduleId);
  if (!module.hasOwnProperty('default')) {
    throw new Error(`Module is missing default export: ${scriptPath}`);
  }
  try {
    let gameObject = GameObject.createBound(module.default, engineObject);
    console.log(`Successfully created bound object for path '${scriptPath}'`, gameObject);
    return gameObject;
  } catch (e) {
    throw new Error(`Failed to create game object for type: ${scriptPath}\n${e}`);
  }
}

function getModule(moduleId: string): Module {
  if (moduleCache[moduleId] === undefined) {
    // This module needs to be loaded
    if (modulesBeingLoaded[moduleId] !== undefined) {
      // Module is already being loaded (but has not resolved yet)
      // @TODO add a stack parameter to show the cycle
      throw new Error(`Cyclic dependency detected, cannot load module ${moduleId}`);
    } else {
      // Load this module
      const moduleDefinition = moduleDefinitions[moduleId];

      if (moduleDefinition === undefined) {
        throw new Error(`Cannot get module with ID '${moduleId}'. No module with this ID has been loaded yet.`);
      }

      // Mark module as being loaded
      modulesBeingLoaded[moduleId] = moduleDefinition;

      // Resolve module's dependencies (load them if they haven't been loaded)
      const module: any = {};
      const dependencies = moduleDefinition.dependencies.map((dependencyId) => {
        if (dependencyId === 'exports') {
          // @NOTE magic dependency id for declaring the module's contents on
          return module;
        } else {
          return getModule(dependencyId);
        }
      })

      moduleDefinition.getter.call(undefined, ...dependencies);

      // Mark module as no-longer being loaded, store in cache
      delete modulesBeingLoaded[moduleId];
      moduleCache[moduleId] = module;
    }
  }

  return moduleCache[moduleId];
}

function pathToModuleId(path: string): string {
  // Strip prefix (if present)
  if (path.indexOf(MAGIC_PREFIX) === 0) {
    // Replace with relative import (./)
    path = path.replace(MAGIC_PREFIX, './');
  } else throw new Error(`Unrecognised; path does not contain magic prefix: ${path}`);

  // Strip file extension (if any)
  let extMatch = /(\.[^.]*)$/.exec(path);
  return path.substring(0, path.length - (extMatch !== null ? extMatch[1].length : 0));
}

function defineModule(callback: (result: ModuleDefinition) => void, ...args: any[]) {
  let moduleName: string | undefined;
  let dependencies: string[];
  let moduleFn: Function;
  if (args.length == 2) {
    // @NOTE @ASSUMPTION params are (dependencies, definition)
    dependencies = args[0];
    moduleFn = args[1];
  } else {
    // @NOTE @ASSUMPTION params are (name, dependencies, definition)
    moduleName = args[0];
    dependencies = args[1];
    moduleFn = args[2];
  }

  callback({
    id: moduleName || "<undefined>",
    dependencies,
    getter: moduleFn,
  } satisfies ModuleDefinition);
}

