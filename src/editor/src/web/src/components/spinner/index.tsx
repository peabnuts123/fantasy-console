import cn from 'classnames';
import type { FunctionComponent } from 'react';


interface Props {
  inverted?: boolean;
  message?: string;
  isIcon?: boolean;
}

const Spinner: FunctionComponent<Props> = ({ inverted, message, isIcon }: Props) => {
  // Prop defaults
  inverted ??= false;
  isIcon ??= false;

  return (
    <div className="spinner__container">
      <div className={cn("spinner", {
        "spinner--inverted": inverted,
        "spinner--small": isIcon,
      })}>
        <div className="rect rect1"></div>
        <div className="rect rect2"></div>
        <div className="rect rect3"></div>
        <div className="rect rect4"></div>
        <div className="rect rect5"></div>
      </div>

      {message && (
        <span>{message}</span>
      )}
    </div>
  );
};

export default Spinner;
