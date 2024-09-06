import { modify, JSONPath, ModificationOptions, applyEdits } from 'jsonc-parser';

const DefaultOptions: ModificationOptions = {
  formattingOptions: {},
}

/**
 * A container for more easily manipulating JSONC documents.
 */
export class JsoncContainer {
  private text: string;

  public constructor(jsonc: string) {
    this.text = jsonc;
  }

  public mutate<TValue>(path: JSONPath, value: TValue extends undefined ? never : TValue, options?: ModificationOptions) {
    // Validate for sanity (typechecking should disallow, but...)
    if (value === undefined) throw new Error('Cannot set JSON value to `undefined`. Use `delete()` to remove a value, or `null` to set it to null.');

    // Merge options with default options
    options = (options === undefined) ?
      DefaultOptions :
      {
        ...DefaultOptions,
        ...options,
      };

    let edits = modify(this.text, path, value, options);
    this.text = applyEdits(this.text, edits);
  }

  public delete(path: JSONPath) {
    let edits = modify(this.text, path, undefined, DefaultOptions);
    this.text = applyEdits(this.text, edits);
  }

  public toString(): string {
    return this.text;
  }
}
