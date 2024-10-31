import cn from 'classnames';
import type { FunctionComponent } from 'react';


interface Props {
  inverted?: boolean;
  message?: string;
}

const Spinner: FunctionComponent<Props> = ({ inverted, message }: Props) => {
  return (
    <div className="spinner__container">
      <div className={cn("spinner", { "spinner--inverted": inverted })}>
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
