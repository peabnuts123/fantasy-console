import { observer } from "mobx-react-lite";
import { KeyboardEventHandler, useEffect, useMemo, useRef, useState, type FunctionComponent } from "react";
import { ColorResult, getContrastingColor, rgbaToHex, rgbStringToHsva } from '@uiw/color-convert';
import Sketch from '@uiw/react-color-sketch';

import { Color3 } from "@fantasy-console/core/src/util";

interface Props {
  label: string;
  color: Color3;
  onChange?: (newValue: Color3) => void;
}

export const ColorInput: FunctionComponent<Props> = observer(({ label, color, onChange }) => {
  // Prop defaults
  onChange ??= () => { };

  // Refs
  const divRef = useRef<HTMLDivElement>(null);

  // State
  const [isColorPickerVisible, setIsColorPickerVisible] = useState<boolean>(false);

  // Computed state
  const colorHex = rgbaToHex({ r: color.r, g: color.g, b: color.b, a: 255 });
  const textColor = getContrastingColor(colorHex);

  // Memoized state
  const initialColor = useMemo(() => colorHex, [isColorPickerVisible]);

  /*
   * Toggle visibility of the picker when anything under this control has
   * focus. Close enough for what we're doing here.
   */
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const isTargetChildOfThisControl = divRef.current!.contains(e.target as Node);
      setIsColorPickerVisible(isTargetChildOfThisControl);
    };

    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('focusin', onFocus);
    };
  }, []);

  // Functions
  /**
   * Hide the colour picker when user presses Escape
   */
  const onKeyPress: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!isColorPickerVisible) return;
    if (e.key === 'Escape') {
      setIsColorPickerVisible(false);
    }
  };

  /**
   * Hide the colour picker when user clicks outside of it
   */
  const onClickFacade = () => {
    setIsColorPickerVisible(false);
  }

  const onColorChange = ({ rgb }: ColorResult) => {
    const result = new Color3(rgb.r, rgb.g, rgb.b);
    onChange(result);
  };

  return (
    <div ref={divRef}>
      <label className="font-bold">{label}</label>
      <div className="relative" onKeyDown={onKeyPress}>
        <input
          type="text"
          className="w-full p-2"
          style={{ backgroundColor: colorHex, color: textColor }}
          value={colorHex}
          readOnly={true}
        />

        {isColorPickerVisible && (
          <Sketch
            /* @NOTE Bloody hell, react-color has all these hard-coded inline styles that have to be overridden */
            className="color-picker absolute bottom-full !w-full z-20 !rounded-none !shadow-none border border-[blue]"
            color={initialColor}
            disableAlpha={true}
            presetColors={false}
            onChange={onColorChange}
          />
        )}

      </div>
      {isColorPickerVisible && (
        <div
          className="w-screen h-screen absolute inset-0 z-10"
          onClick={onClickFacade}
        />
      )}
    </div>
  );
});
