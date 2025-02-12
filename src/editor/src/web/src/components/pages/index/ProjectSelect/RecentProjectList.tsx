import { useEffect, useState, type FunctionComponent, useRef } from "react";
import { open } from '@tauri-apps/plugin-dialog';
import { ArrowUpTrayIcon, DocumentIcon } from '@heroicons/react/24/outline';

import { useLibrary } from "@lib/index";
import { ApplicationData } from "@lib/application";
import { RecentProjectTile } from "./RecentProjectTile";
import { observer } from "mobx-react-lite";


interface RecentProjectListProps {
  showCreateProjectScreen: () => void;
  showErrorMessage: (error: string) => void;
}

export const RecentProjectList: FunctionComponent<RecentProjectListProps> = observer(({ showCreateProjectScreen, showErrorMessage }) => {
  const { ProjectController, ApplicationDataController } = useLibrary();

  // State
  const [appData, setAppData] = useState<ApplicationData | undefined>(undefined);

  // Computed state
  const isAppDataLoaded = appData !== undefined;

  // Effects
  useEffect(() => {
    if (ApplicationDataController.hasLoadedAppData) {
      setAppData(ApplicationDataController.appData);
    }
  }, [ApplicationDataController.hasLoadedAppData]);

  // Functions
  const loadProject = async (): Promise<void> => {
    const selected = await open({
      filters: [{
        name: 'PolyZone Project',
        extensions: ['pzproj'],
      }],
    }) as string | null;

    if (selected === null) return;

    await ProjectController.loadProject(selected);
  };

  return (
    <>
      <div className="flex flex-row justify-between mb-2">
        <h2 className="text-h2 text-retro-shadow font-serif">Recent projects</h2>

        <div className="flex flex-row">
          <button onClick={loadProject} className="button"><ArrowUpTrayIcon className="icon mr-1" /> Open project</button>
          <button onClick={showCreateProjectScreen} className="button"><DocumentIcon className="icon mr-1" /> New project</button>
        </div>
      </div>

      <div className="w-full overflow-y-auto grow">
        {isAppDataLoaded && (
          <>
            {/* Empty list */}
            {appData.recentProjects.length === 0 && (
              <div className="h-full flex flex-col">
                <div className="w-full bg-slate-800 bg-opacity-30 mb-4 p-4">You have no recent projects. Create a project or open an existing one.</div>
                <PlsGiveWall />
              </div>
            )}

            {/* Recent projects */}
            {appData.recentProjects.map((project, index) => (
              <RecentProjectTile key={index} project={project} showError={showErrorMessage} />
            ))}
          </>
        )}
      </div>
    </>
  );
});

const PlsGiveWall: FunctionComponent = () => {
  // Constants
  const ResizeMaxFrequency = 15;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const firstRowRef = useRef<HTMLDivElement>(null);
  const resizeDebounceKey = useRef<number | undefined>(undefined);
  // State
  const [numRows, setNumRows] = useState<number>(8);

  useEffect(() => {
    // Observe container size
    const resizeObserver = new ResizeObserver((entries) => {
      const containerSize = entries[0].contentRect;
      const rowHeight = firstRowRef.current?.clientHeight;

      if (rowHeight) {
        // Fire resize event, rate-limited to `ResizeMaxFrequency`
        if (resizeDebounceKey.current === undefined) {
          // @NOTE TypeScript is confused here between DOM and Node.js, specify `window` to disambiguate
          resizeDebounceKey.current = window.setTimeout(() => {
            resizeDebounceKey.current = undefined;
            onContainerResize(containerSize.height, rowHeight);
          }, 1000 / ResizeMaxFrequency);
        }
      }
    });
    resizeObserver.observe(containerRef.current as unknown as Element); // @TODO FUCK YOU REACT!!!!!!

    // Fire initial resize
    const containerHeight = containerRef.current?.clientHeight;
    const rowHeight = firstRowRef.current?.clientHeight;
    if (containerHeight && rowHeight) {
      onContainerResize(containerHeight, rowHeight);
    }
  }, []);

  // Functions
  /**
   * Recalculate the number of rows visible, based on the container and row heights.
   */
  function onContainerResize(containerHeight: number, rowHeight: number): void {
    setNumRows(Math.floor(containerHeight / rowHeight));
  }

  /**
   * Really silly utility function to aggregate results from an iteration
   * into an array.
   */
  function repeat<TOutput>(count: number, getValue: (index: number) => TOutput): TOutput[] {
    const results: TOutput[] = [];
    for (let i = 0; i < count; i++) {
      results.push(getValue(i));
    }
    return results;
  }

  return (
    <div className="grow overflow-y-hidden" ref={containerRef} data-id="face-container">{
      /* @NOTE There are always 50 rows visible. `numRows` just controls their opacity */
      repeat(50, (lineIndex) => (
        <div className="text-3xl overflow-hidden whitespace-nowrap marquee pb-4" key={lineIndex} ref={lineIndex === 0 ? firstRowRef : null}>
          {/* @NOTE 10 is just a magic number that's more than the number of elements that can fit in a row */}
          {repeat(10, (index) => (
            <span
              className="pr-8"
              style={{
                animationDelay: `-${lineIndex * 200}ms`,
                opacity: `${Math.pow((numRows - Math.min(numRows, lineIndex)) / numRows, 2) * 100}%`,
              }} key={index}
            >༼ つ ◕_◕ ༽つ</span>
          ))}
        </div>
      ))
    }</div>
  );
};
