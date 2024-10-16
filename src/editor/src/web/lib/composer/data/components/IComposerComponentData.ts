import { ComponentDefinition } from "@fantasy-console/runtime/src/cartridge/archive";

/**
 * Component data that is specific to the composer.
 */
export interface IComposerComponentData {
  id: string;
  get componentName(): string;
  toComponentDefinition(): ComponentDefinition;
}
