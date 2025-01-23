import { observer } from "mobx-react-lite";
import type { ChangeEventHandler, FunctionComponent } from "react";
import { useState } from "react";

interface Props {
  label: string;
  value: string;
  onChange?: (newValue: string) => void;
}

export const TextInput: FunctionComponent<Props> = observer(({ label, value, onChange }) => {
  // Parameter defaults
  onChange ??= () => { };

  // State
  const [isTextInputFocused, setIsTextInputFocused] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>(`${value}`);

  // Computed state
  const displayValue = isTextInputFocused ? inputText : `${value}`;

  // Functions
  const onInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const inputText = e.target.value;
    setInputText(inputText);
    onChange(inputText);
  };

  const onFocusTextInput = () => {
    setInputText(`${value}`);
    setIsTextInputFocused(true);
  };

  const onBlurTextInput = () => {
    setIsTextInputFocused(false);
  };

  return (
    <div className="mt-2">
      <label>
        <span className="font-bold">{label}</span>
        <input
          type="text"
          className="w-full p-1"
          value={displayValue}
          minLength={1}
          onChange={onInputChange}
          onFocus={onFocusTextInput}
          onBlur={onBlurTextInput}
        />
      </label>
    </div>
  );
});
