export interface IModule {
  onUpdate(deltaTime: number): void;
  /**
   * @internal
   */
  onInit(): void;
  /**
   * @internal
   */
  dispose(): void;
}
