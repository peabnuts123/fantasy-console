import { Vector2 } from "@fantasy-console/core/src/util";
import { Vector3 } from "@fantasy-console/core/src/util/Vector3";
import { observer } from "mobx-react-lite";
import { ChangeEventHandler, FunctionComponent, MouseEventHandler, useEffect, useState } from "react";

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
  // Constants
  const DragSensitivity = 1;

  // State
  const [dragStartPosition, setDragStartPosition] = useState<Vector2>();
  const [originalPreDragValue, setOriginalPreDragValue] = useState<number>();

  // Computed state
  const isDragging = dragStartPosition !== undefined;

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging && originalPreDragValue !== undefined) {
        const mousePosition = new Vector2(e.clientX, e.clientY);
        const delta = mousePosition.subtract(dragStartPosition).multiplySelf(DragSensitivity / 100);


        // @TODO can we build a UX that lets you drag up OR right?
        const size = delta.x;

        console.log(`Dragging. Delta: `, delta, size);
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
    const newValue = Number(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    } else {
      console.warn(`[VectorInputComponent] (onInputChange) Could not parse number: ${e.target.value}`);
    }
  };

  const onStartDrag: MouseEventHandler<HTMLSpanElement> = (e) => {
    setOriginalPreDragValue(value);
    setDragStartPosition(new Vector2(e.clientX, e.clientY));
  }

  return (
    <div className="pl-3 mb-1">
      <label className="block relative pl-5">
        <span className="absolute left-0 py-1 cursor-col-resize" onMouseDown={onStartDrag}>{label}</span>
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