import { observer } from "mobx-react-lite";
import type { FunctionComponent } from "react";

import type { ColorDefinition } from "@fantasy-console/runtime/src/cartridge/archive/util";

interface Props {
  label: string;
  color: ColorDefinition; // @TODO LOL this is going to change! Core needs a color type, like Vector
}

/**
 * Convert a colour into a CSS hex string e.g. `#FF7000`
 */
function formatColorString(color: ColorDefinition) {
  return '#' + (
    (~~(color.r * 0xFF)).toString(16).padStart(2, '0') +
    (~~(color.g * 0xFF)).toString(16).padStart(2, '0') +
    (~~(color.b * 0xFF)).toString(16).padStart(2, '0')
  );
}

export const ColorInput: FunctionComponent<Props> = observer(({ label, color }) => {
  const bgColor = formatColorString(color);
  return (
    <div className="mt-2">
      <label className="font-bold">{label}</label>
      <div className="">
        {/* X */}
        <ColorInputComponent label="R" value={color.r} bgColor={bgColor} />
        {/* Y */}
        <ColorInputComponent label="G" value={color.g} bgColor={bgColor} />
        {/* Z */}
        <ColorInputComponent label="B" value={color.b} bgColor={bgColor} />
      </div>
    </div>
  );
});

interface ColorInputComponentProps {
  label: string;
  value: number;
  bgColor: string;
}

const ColorInputComponent: FunctionComponent<ColorInputComponentProps> = ({ label, value, bgColor }) => {
  return (
    <div className="pl-3 mb-1">
      <label className="block relative pl-5">
        <span className="absolute left-0 py-1">{label}</span>
        <input
          type="number"
          className="w-full p-1"
          style={{ backgroundColor: bgColor }}
          value={value} readOnly={true}
        />
      </label>
    </div>
  );
}