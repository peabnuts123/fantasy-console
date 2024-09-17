import { Vector3 } from "@fantasy-console/core/src/util/Vector3";
import { FunctionComponent } from "react";

interface Props {
  label: string;
  vector: Vector3;
}

export const VectorInput: FunctionComponent<Props> = ({ label, vector }) => {
  return (
    <div className="mt-2">
      <label className="font-bold">{label}</label>
      <div className="">
        {/* X */}
        <VectorInputComponent label="X" value={vector.x} />
        {/* Y */}
        <VectorInputComponent label="Y" value={vector.y} />
        {/* Z */}
        <VectorInputComponent label="Z" value={vector.z} />
      </div>
    </div>
  );
};

interface VectorInputComponentProps {
  label: string;
  value: number;
}

const VectorInputComponent: FunctionComponent<VectorInputComponentProps> = ({ label, value }) => {
  return (
    <div className="pl-3 mb-1">
      <label className="block relative pl-5">
        <span className="absolute left-0 py-1">{label}</span>
        <input
          type="number"
          className="w-full p-1"
          value={value} readOnly={true}
        />
      </label>
    </div>
  );
}