import { observer } from "mobx-react-lite";

import type { PointLightComponentData } from "@lib/composer/data";
import { SetGameObjectLightComponentColorMutation, SetGameObjectLightComponentIntensityMutation } from "@lib/mutation/scene/mutations";
import { ColorInput } from "../ColorInput";
import { NumberInput } from "../NumberInput";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const PointLightInspector: InspectorComponent<PointLightComponentData> = observer(({ component, controller, gameObject }) => {
  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <ColorInput
        label="Color"
        color={component.color}
        onChange={(newValue) => controller.mutator.debounceContinuous(
          SetGameObjectLightComponentColorMutation,
          gameObject,
          () => new SetGameObjectLightComponentColorMutation(gameObject, component),
          () => ({ color: newValue })
        )}
      />

      <NumberInput
        label="Intensity"
        value={component.intensity}
        incrementInterval={0.1}
        onChange={(newValue) => controller.mutator.debounceContinuous(
          SetGameObjectLightComponentIntensityMutation,
          gameObject,
          () => new SetGameObjectLightComponentIntensityMutation(gameObject, component),
          () => ({ intensity: newValue })
        )}
      />
    </InspectorComponentBase>
  )
});
