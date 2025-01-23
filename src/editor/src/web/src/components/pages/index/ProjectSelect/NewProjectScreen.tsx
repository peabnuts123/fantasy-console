import { type FunctionComponent } from "react";

export interface NewProjectScreenProps {
  cancelCreate: () => void;
}
export const NewProjectScreen: FunctionComponent<NewProjectScreenProps> = ({ cancelCreate }) => {
  return (
    <>
      <div className="flex flex-row justify-between mb-2">
        <h2 className="text-h2 text-retro-shadow font-serif mb-4">New project</h2>

        <div className="flex flex-row">
          <button onClick={cancelCreate} className="button">Cancel</button>
        </div>
      </div>

      <div>
        This is the NEW PROJECT screen.
      </div>
    </>
  );
};