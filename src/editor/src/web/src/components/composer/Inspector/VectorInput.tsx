import { observer } from "mobx-react-lite";
import type { FunctionComponent } from "react";

import { Vector3 } from "@polyzone/core/src/util/Vector3";
import { NumberInput } from "./NumberInput";


interface Props {
  label: string;
  vector: Vector3;
  incrementInterval?: number;
  onChange?: (newValue: Vector3) => void;
}

export const VectorInput: FunctionComponent<Props> = observer(({ label, vector, incrementInterval, onChange }) => {
  // Prop defaults
  onChange ??= () => { };
  incrementInterval ??= 1;

  return (
    <div className="mt-2">
      <label className="font-bold">{label}</label>
      <div className="">
        {/* X */}
        <NumberInput label="X" displayLabelAsSubProperty={true} value={vector.x} onChange={(newX) => onChange(vector.withX(newX))} incrementInterval={incrementInterval} />
        {/* Y */}
        <NumberInput label="Y" displayLabelAsSubProperty={true} value={vector.y} onChange={(newY) => onChange(vector.withY(newY))} incrementInterval={incrementInterval} />
        {/* Z */}
        <NumberInput label="Z" displayLabelAsSubProperty={true} value={vector.z} onChange={(newZ) => onChange(vector.withZ(newZ))} incrementInterval={incrementInterval} />
      </div>
    </div>
  );
});
