import { observer } from "mobx-react-lite";
import { FunctionComponent } from "react";
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

import { WritingState } from "@lib/filesystem/TauriFileSystem";
import { useLibrary } from "@lib/index";
import Spinner from "@app/components/spinner";

interface Props { }

export const StatusBar: FunctionComponent<Props> = observer(({ }) => {
  const { ProjectController } = useLibrary();

  const status = {
    [WritingState.Writing]: <><Spinner isIcon={true} /> Saving changes...</>,
    [WritingState.UpToDate]: <><CheckCircleIcon className="icon mr-1"/> All saved</>,
    [WritingState.Failed]: <span className="text-pink-500"><ExclamationTriangleIcon className="icon mr-1" /> Error saving!</span>,
  }[ProjectController.fileSystem.writingState];

  return (
    <div className="flex flex-row justify-end items-center p-2 border-t border-t-slate-300 text-gray-500">{status}</div>
  );
});
