import classNames from 'classnames';
import { FunctionComponent } from 'react';

import Condition from '@app/components/util/condition';

interface Props {
  inverted?: boolean;
  message?: string;
}

const Spinner: FunctionComponent<Props> = ({ inverted, message }: Props) => {
  return (
    <div className="spinner__container">
      <div className={classNames("spinner", { "spinner--inverted": inverted })}>
        <div className="rect rect1"></div>
        <div className="rect rect2"></div>
        <div className="rect rect3"></div>
        <div className="rect rect4"></div>
        <div className="rect rect5"></div>
      </div>
      <Condition if={!!message}
        then={() => (
          <span>{message}</span>
        )}
      />
    </div>
  );
};

export default Spinner;
