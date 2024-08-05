import { FunctionComponent, PropsWithChildren } from 'react';
import { observer } from 'mobx-react-lite';

interface Props {
  if: boolean;
  then?: FunctionComponent;
  else?: FunctionComponent;
}

export const Condition: FunctionComponent<Props> = observer(({ if: _if, then: _then, else: _else }) => {
  let Child: FunctionComponent = observer(() => (<></>));
  if (_if && _then) {
    Child = observer(_then);
  } else if (!_if && _else) {
    Child = observer(_else);
  }
  return (
    <Child />
  )
});

export default Condition;
