import { Vector3 } from "@fantasy-console/core/src/util/Vector3";
import { observer } from "mobx-react-lite";
import { ChangeEvent, FunctionComponent } from "react";

interface Props {
  label: string;
  vector: Vector3;
  onChange?: (newValue: Vector3) => void;
}

export const VectorInput: FunctionComponent<Props> = observer(({ label, vector, onChange }) => {
  // Default onChange to a no-op function
  onChange ??= () => { };

  return (
    <div className="mt-2">
      <label className="font-bold">{label}</label>
      <div className="">
        {/* X */}
        <VectorInputComponent label="X" value={vector.x} onChange={(newX) => onChange(vector.withX(newX))} />
        {/* Y */}
        <VectorInputComponent label="Y" value={vector.y} onChange={(newY) => onChange(vector.withY(newY))} />
        {/* Z */}
        <VectorInputComponent label="Z" value={vector.z} onChange={(newZ) => onChange(vector.withZ(newZ))} />
      </div>
    </div>
  );
});

interface VectorInputComponentProps {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
}

const VectorInputComponent: FunctionComponent<VectorInputComponentProps> = ({ label, value, onChange }) => {
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    } else {
      console.warn(`[VectorInputComponent] (onInputChange) Could not parse number: ${e.target.value}`);
    }
  };

  return (
    <div className="pl-3 mb-1">
      <label className="block relative pl-5">
        <span className="absolute left-0 py-1">{label}</span>
        <input
          type="number"
          className="w-full p-1"
          value={value}
          onChange={onInputChange}
        />
      </label>
    </div>
  );
}