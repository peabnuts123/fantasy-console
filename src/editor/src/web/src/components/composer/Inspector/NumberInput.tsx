import type { ChangeEventHandler, FunctionComponent, MouseEventHandler, FocusEvent, KeyboardEvent, KeyboardEventHandler } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import cn from 'classnames';

import { Vector2 } from "@fantasy-console/core/src/util";

export interface NumberInputProps {
  value: number;
  label?: string;
  displayLabelAsSubProperty?: boolean;
  incrementInterval?: number;
  onChange?: (newValue: number) => void;
  className?: string;
}

function roundValue(value: number): number {
  // JAVASCRIPT!!!! >:E
  // Fix things like `1.1 + 0.1 = 1.2000000000000002`
  return Math.round(value * 1e10) / 1e10;
}

export const NumberInput: FunctionComponent<NumberInputProps> = ({ label, value, incrementInterval, onChange, displayLabelAsSubProperty, className }) => {
  // Prop defaults
  onChange ??= () => { };
  incrementInterval ??= 1;
  displayLabelAsSubProperty ??= false;
  className ??= '';

  // Constants
  const DragSensitivity = 1;

  // State
  const [dragStartPosition, setDragStartPosition] = useState<Vector2>();
  const [originalPreDragValue, setOriginalPreDragValue] = useState<number>();
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isTextInputFocused, setIsTextInputFocused] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>(`${value}`);

  // Computed state
  const hasLabel = label !== undefined;
  const isDragging = dragStartPosition !== undefined;
  const displayValue = isTextInputFocused ? inputText : `${value}`;

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonUpRef = useRef<HTMLButtonElement>(null);
  const buttonDownRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent): void => {
      if (isDragging && originalPreDragValue !== undefined) {
        const mousePosition = new Vector2(e.clientX, e.clientY);
        const delta = mousePosition.subtract(dragStartPosition).multiplySelf(DragSensitivity / 100);
        // @TODO can we build a UX that lets you drag up OR right?
        const size = delta.x;
        onChange(roundValue(originalPreDragValue + size));
      }
    };
    const onMouseUp = (): void => {
      setDragStartPosition(undefined);
      setOriginalPreDragValue(undefined);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
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
      onChange(roundValue(newValue));
    } else {
      console.warn(`[NumberInput] (onInputChange) Could not parse number: ${e.target.value}`);
    }
  };

  const isElementFocused = (element: Element | null): boolean => (
    element !== null && (
      element === inputRef.current ||
      element === buttonUpRef.current ||
      element === buttonDownRef.current
    ));

  const onBlurInputElement = (e: FocusEvent<Element, Element>): void => {
    const newActiveElement = e.relatedTarget;
    const newIsFocused = isElementFocused(newActiveElement);
    if (newIsFocused !== isFocused) {
      setTimeout(() =>
        setIsFocused(newIsFocused),
      );
    }
  };

  const onFocusTextInput = (): void => {
    setInputText(`${value}`);
    setIsTextInputFocused(true);
  };

  const onBlurTextInput = (): void => {
    setIsTextInputFocused(false);
  };

  const onStartDrag: MouseEventHandler<HTMLSpanElement> = (e) => {
    setOriginalPreDragValue(value);
    setDragStartPosition(new Vector2(e.clientX, e.clientY));
  };

  // @TODO Hold shift or something to do bigger increments
  const incrementValue = (): void => {
    const newValue = roundValue(value + incrementInterval);
    onChange(newValue);
    setInputText(`${newValue}`);
  };

  const decrementValue = (): void => {
    const newValue = roundValue(value - incrementInterval);
    onChange(newValue);
    setInputText(`${newValue}`);
  };

  const onKeyPressInput: KeyboardEventHandler = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      incrementValue();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrementValue();
    }
  };

  return (
    <div className={cn("mb-1", className)}>
      <label className={cn({ '': hasLabel && !displayLabelAsSubProperty })}>
        {/* "Title" style label */}
        {hasLabel && !displayLabelAsSubProperty && (
          <div className="font-bold cursor-col-resize mt-2" onMouseDown={onStartDrag}>{label}</div>
        )}
        <div className="flex flex-row items-center">
          {/* "Sub-property" style label */}
          {hasLabel && displayLabelAsSubProperty && (
            <div className="block shrink-0 w-8 py-1 cursor-col-resize text-center" onMouseDown={onStartDrag}>{label}</div>
          )}
          <input
            ref={inputRef}
            className="w-full px-1 h-10 grow"
            value={displayValue}
            onChange={onInputChange}
            onFocus={() => { onFocusTextInput(); setIsFocused(true); }}
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
              <ArrowUpIcon className="icon w-3" />
            </button>
            <button
              tabIndex={-1}
              ref={buttonDownRef}
              className="flex flex-col justify-center items-center bg-white p-1 grow active:bg-blue-500 hover:bg-blue-300"
              onFocus={() => setIsFocused(true)}
              onBlur={onBlurInputElement}
              onClick={decrementValue}
            >
              <ArrowDownIcon className="icon w-3" />
            </button>
          </div>
        </div>
      </label>
    </div>
  );
};
