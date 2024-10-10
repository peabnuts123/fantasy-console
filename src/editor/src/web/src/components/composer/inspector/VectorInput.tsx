import { observer } from "mobx-react-lite";
import type { ChangeEventHandler, FunctionComponent, MouseEventHandler, FocusEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import cn from 'classnames';

import { Vector2 } from "@fantasy-console/core/src/util";
import { Vector3 } from "@fantasy-console/core/src/util/Vector3";


interface Props {
  label: string;
  vector: Vector3;
  incrementInterval?: number;
  onChange?: (newValue: Vector3) => void;
}

export const VectorInput: FunctionComponent<Props> = observer(({ label, vector, incrementInterval, onChange }) => {
  // Parameter defaults
  onChange ??= () => { };
  incrementInterval ??= 1;

  return (
    <div className="mt-2">
      <label className="font-bold">{label}</label>
      <div className="">
        {/* X */}
        <VectorInputComponent label="X" value={vector.x} onChange={(newX) => onChange(vector.withX(newX))} incrementInterval={incrementInterval} />
        {/* Y */}
        <VectorInputComponent label="Y" value={vector.y} onChange={(newY) => onChange(vector.withY(newY))} incrementInterval={incrementInterval} />
        {/* Z */}
        <VectorInputComponent label="Z" value={vector.z} onChange={(newZ) => onChange(vector.withZ(newZ))} incrementInterval={incrementInterval} />
      </div>
    </div>
  );
});

interface VectorInputComponentProps {
  label: string;
  value: number;
  incrementInterval: number;
  onChange: (newValue: number) => void;
}

const VectorInputComponent: FunctionComponent<VectorInputComponentProps> = ({ label, value, incrementInterval, onChange }) => {
  // Constants
  const DragSensitivity = 1;

  // State
  const [dragStartPosition, setDragStartPosition] = useState<Vector2>();
  const [originalPreDragValue, setOriginalPreDragValue] = useState<number>();
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isTextInputFocused, setIsTextInputFocused] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>(`${value}`);

  // Computed state
  const isDragging = dragStartPosition !== undefined;
  const displayValue = isTextInputFocused ? inputText : `${value}`;

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonUpRef = useRef<HTMLButtonElement>(null);
  const buttonDownRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging && originalPreDragValue !== undefined) {
        const mousePosition = new Vector2(e.clientX, e.clientY);
        const delta = mousePosition.subtract(dragStartPosition).multiplySelf(DragSensitivity / 100);
        // @TODO can we build a UX that lets you drag up OR right?
        const size = delta.x;
        onChange(originalPreDragValue + size);
      }
    }
    const onMouseUp = () => {
      setDragStartPosition(undefined);
      setOriginalPreDragValue(undefined);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
    }
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  // Functions
  const onInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const inputText = e.target.value;
    setInputText(inputText);
    // @TODO parse simple expressions like 1+1 or whatever.
    const newValue = Number(inputText);
    if (!isNaN(newValue)) {
      onChange(newValue);
    } else {
      console.warn(`[VectorInputComponent] (onInputChange) Could not parse number: ${e.target.value}`);
    }
  };

  const isElementFocused = (element: Element | null) => (
    element !== null && (
      element === inputRef.current ||
      element === buttonUpRef.current ||
      element === buttonDownRef.current
    ));

  const onBlurInputElement = (e: FocusEvent<Element, Element>) => {
    const newActiveElement = e.relatedTarget;
    const newIsFocused = isElementFocused(newActiveElement);
    if (newIsFocused !== isFocused) {
      setTimeout(() =>
        setIsFocused(newIsFocused)
      );
    }
  };

  const onFocusTextInput = () => {
    setInputText(`${value}`);
    setIsTextInputFocused(true);
  };

  const onBlurTextInput = () => {
    setIsTextInputFocused(false);
  };

  const onStartDrag: MouseEventHandler<HTMLSpanElement> = (e) => {
    setOriginalPreDragValue(value);
    setDragStartPosition(new Vector2(e.clientX, e.clientY));
  };

  // @TODO Hold shift or something to do bigger increments
  const incrementValue = () => {
    const newValue = value + incrementInterval;
    onChange(newValue);
    setInputText(`${newValue}`);
  };

  const decrementValue = () => {
    const newValue = value - incrementInterval;
    onChange(newValue);
    setInputText(`${newValue}`);
  };

  const onKeyPressInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      incrementValue();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrementValue();
    }
  };

  return (
    <div className="mb-1">
      <label className="flex flex-row items-center">
        <div className="block shrink-0 w-8 py-1 cursor-col-resize text-center" onMouseDown={onStartDrag}>{label}</div>
        <input
          ref={inputRef}
          className="w-full px-1 h-[48px] grow"
          value={displayValue}
          onChange={onInputChange}
          onFocus={() => { onFocusTextInput(); setIsFocused(true) }}
          onBlur={(e) => { onBlurTextInput(); onBlurInputElement(e); }}
          onKeyDown={onKeyPressInput}
        />
        <div className={cn("flex-col shrink-0", { 'hidden': !isFocused, 'flex': isFocused })}>
          <button
            tabIndex={-1}
            ref={buttonUpRef}
            className="flex flex-col justify-center items-center bg-white p-1 grow active:bg-blue-500 hover:bg-blue-300"
            onFocus={() => setIsFocused(true)}
            onBlur={onBlurInputElement}
            onClick={incrementValue}
          >
            <ArrowUpIcon className="!w-4" />
          </button>
          <button
            tabIndex={-1}
            ref={buttonDownRef}
            className="flex flex-col justify-center items-center bg-white p-1 grow active:bg-blue-500 hover:bg-blue-300"
            onFocus={() => setIsFocused(true)}
            onBlur={onBlurInputElement}
            onClick={decrementValue}
          >
            <ArrowDownIcon className="!w-4" />
          </button>
        </div>
      </label>
    </div>
  );
}