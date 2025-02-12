import { z } from 'zod';
import { readTextFile } from "@tauri-apps/plugin-fs";
import { makeAutoObservable } from 'mobx';

/** The max number of projects to keep in "recent projects" app data. */
export const MAX_RECENT_PROJECTS = 10;

/** Data about recently-opened projects. */
export const RecentProjectDataSchema = z.object({
  name: z.string().nonempty(),
  path: z.string().nonempty(),
  lastOpened: z.coerce.date(),
  // @TODO which scenes are open
});

/** PolyZone application data. Top-level object. */
export const ApplicationDataSchema = z.object({
  version: z.string().nonempty(),
  recentProjects: z.array(RecentProjectDataSchema).max(MAX_RECENT_PROJECTS),
});

/** PolyZone application data. Top-level object. */
export type ApplicationData = z.infer<typeof ApplicationDataSchema>;
/** Data about recently-opened projects. */
export type RecentProjectData = z.infer<typeof RecentProjectDataSchema>;

/** Create default app data for when there is no app data found on-disk. */
export function createNewApplicationData(): ApplicationData {
  return makeAutoObservable({
    version: '1.0',
    recentProjects: [],
  });
}

/**
 * Read and parse a file path into app data, validating the schema
 * of the file contents.
 */
export async function loadApplicationData(appDataPath: string): Promise<ApplicationData> {
  const json = await readTextFile(appDataPath);
  const appDataRaw = JSON.parse(json) as unknown;
  return makeAutoObservable(
    ApplicationDataSchema.parseAsync(appDataRaw),
  );
}
