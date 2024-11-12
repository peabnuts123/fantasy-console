/* eslint-disable react-hooks/rules-of-hooks */
import { FunctionComponent, PropsWithChildren, ReactNode, createContext, useContext, useEffect, useState } from "react";
import cn from 'classnames';

export type TabState = ReturnType<typeof createTabState>;

const createTabState = (defaultTabId: string) => {
  const [currentTabPageId, setCurrentTabPageId] = useState<string>(defaultTabId);

  // Update the current tab if the default tabId changes
  // Useful for dynamic tab sets. Might be debug, not sure.
  useEffect(() => {
    if (currentTabPageId !== defaultTabId) {
      setCurrentTabPageId(defaultTabId);
    }
  }, [defaultTabId]);

  return {
    /** ID of the tab page that is currently active */
    currentTabPageId,
    /** Set the currently active tab page ID */
    setCurrentTabPageId,
  }
};

interface TabButtonCommonProps {
  /** Text to display in the tab button. Mutually exclusive with `innerContent` */
  label?: string;
  /** JSX content to display in the tab button. Mutually exclusive with `label` */
  innerContent?: ReactNode;
}

interface TabPageButtonProps extends TabButtonCommonProps {
  /** Type of tab button */
  type: 'page';
  /** Id of the tab page associated with this button */
  tabId: string;
}

interface TabActionButtonProps extends TabButtonCommonProps {
  /** Type of tab button */
  type: 'action',
  /** Callback for when this button is clicked */
  onClick: () => void;
}

type TabButtonProps = TabPageButtonProps | TabActionButtonProps;

/**
 * An individual tab button. You probably want to use {@link TabBar} unless you are doing
 * something very custom.
 */
export const TabButton: FunctionComponent<TabButtonProps> = (props) => {
  // Props
  const {
    type,
    label,
    innerContent,
  } = props;

  // Different types of props
  const actionProps = type === 'action' ? props : undefined;
  const pageTypeProps = type === 'page' ? props : undefined;
  const isActionType = actionProps !== undefined;
  const isPageType = pageTypeProps !== undefined;

  // Hooks
  const TabState = useTabState();

  // Computed state
  const isTabActive = !isPageType || TabState.currentTabPageId === pageTypeProps.tabId;

  // Functions
  const onClick = () => {
    if (isPageType) {
      const { tabId } = pageTypeProps;
      TabState.setCurrentTabPageId(tabId);
    } else if (isActionType) {
      actionProps.onClick();
    } else {
      throw new Error(`Unimplemented TabButton type: '${type}'`);
    }
  };

  return (
    <>
      <button
        className={cn(
          "peer", // @NOTE Used by TabBar for hover selector
          "min-h-[33px]", // @NOTE Ensure small content doesn't shrink the button. 33 = 24 (content) + 8 (padding) + 1 (top border)
          "border-t border-r border-l border-black mt-1 ml-1 mr-2 py-1 px-2  text-black retro-shadow hover:bg-blue-300 active:bg-blue-500 inline-flex flex-row items-center justify-center",
          { 'bg-slate-300': !isTabActive },
          { 'bg-white': isTabActive },
        )}
        onClick={() => onClick()}
      >
        {label || innerContent}
      </button>
    </>
  );
};


interface TabPageProps {
  /** ID of this this tab page */
  tabId: string;
}

/**
 * A block that is only rendered when `tabId` is the currently selected tab.
 */
export const TabPage: FunctionComponent<PropsWithChildren<TabPageProps>> = ({
  children,
  tabId,
}) => {
  // Hooks
  const TabState = useTabState();

  // Computed state
  const isTabVisible = TabState.currentTabPageId === tabId;

  return (
    <>
      {isTabVisible && (
        children
      )}
    </>
  )
};


interface TabBarProps {
  /** List of props for tab buttons */
  tabs: TabButtonProps[];
  /**
   * Class to apply for the background colour of the bottom portion of the tab set.
   * Should match the colour of whatever the background colour is for the tab pages.
   * Defaults to `bg-white`.
   */
  bgColorClass?: string;
}
/**
 * A set of tabs rendered as a horizontal bar. Also renders the top of an adjacent container below so that a border
 * line can be drawn to emphasise which tab is selected. You can use `bgColorClass` to set the background
 * colour of the bottom portion of the tab set. This should match the background colour of the tab pages.
 */
export const TabBar: FunctionComponent<TabBarProps> = ({ tabs, bgColorClass }) => {
  // Prop defaults
  bgColorClass ??= "bg-white";

  // Hooks
  const tabState = useTabState();

  return (
    <div className="flex flex-row relative">
      {/* Pre border */}
      <div className="flex flex-col w-1">
        {/* Block the same height as a tab */}
        <div className="mt-[13px] h-6" />

        {/* Border */}
        <div className={cn("h-2 grow border-t border-black", bgColorClass)}></div>
      </div>

      {/* Tabs */}
      {tabs.map((tab, index) => (
        <div className="flex flex-col" key={tab.type === 'page' ? tab.tabId : index}>
          {/* The button */}
          <TabButton {...tab} /> {/* @NOTE has `peer` on it for detecting hover state */}

          {/* Bits of border */}
          <div className="flex flex-row w-full group">
            {/* pre-button padding */}
            <div className={cn("h-2 w-[5px] x!bg-[fuchsia] border-t border-black", bgColorClass)} />
            {/* underneath button - only shown if the button ISN'T selected */}
            <div className={cn(
              "h-2 x!bg-[blue] grow",
              bgColorClass,
              { "border-t border-t-black": tab.type !== 'page' || tabState.currentTabPageId !== tab.tabId },
              { "border-t border-t-white peer-hover:group-[]:border-t-blue-300 peer-active:group-[]:border-t-blue-500": tab.type === 'page' && tabState.currentTabPageId === tab.tabId },
            )}></div>
            {/* post-button padding */}
            <div className={cn("h-2 w-[9px] x!bg-[fuchsia] border-t border-black", bgColorClass)} />
          </div>
        </div>
      ))}

      {/* Remaining border */}
      <div className="flex flex-col grow">
        {/* Block the same height as a tab */}
        <div className="mt-[13px] h-6" />

        {/* Border */}
        <div className={cn("h-2 grow border-t border-black", bgColorClass)}></div>
      </div>
    </div>
  )
};


interface TabProviderProps {
  defaultTabId: string;
}
/**
 * Provider component for tab state. Must exist as a parent of any tab components.
 */
export const TabProvider: FunctionComponent<PropsWithChildren<TabProviderProps>> = ({
  children,
  defaultTabId,
}) => {
  const tabData = createTabState(defaultTabId);
  return (
    <TabStateContext.Provider value={tabData}>
      {children}
    </TabStateContext.Provider>
  )
}

const TabStateContext = createContext<TabState>(undefined!);
export const useTabState = () => useContext(TabStateContext);