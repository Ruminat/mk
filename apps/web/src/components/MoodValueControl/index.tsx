import { ControlGroupOption, SegmentedRadioGroup, SegmentedRadioGroupProps } from "@gravity-ui/uikit";
import { notEmpty } from "@shreklabs/core";
import { useFn } from "@shreklabs/ui";
import { TMoodStringValue, TMoodValue } from "../../models/mood/definitions";

const options: ControlGroupOption<TMoodStringValue>[] = [
  { value: "1", content: "1" },
  { value: "2", content: "2" },
  { value: "3", content: "3" },
  { value: "4", content: "4" },
  { value: "5", content: "5" },
  { value: "6", content: "6" },
  { value: "7", content: "7" },
  { value: "8", content: "8" },
  { value: "9", content: "9" },
  { value: "10", content: "10" },
];

type TProps = Omit<SegmentedRadioGroupProps, "options" | "value" | "onUpdate"> & {
  value: TMoodValue | undefined;
  onUpdate: (updated: TMoodValue) => void;
};

export function MoodValueControl({ value, onUpdate, ...props }: TProps) {
  return (
    <SegmentedRadioGroup
      {...props}
      options={options}
      value={notEmpty(value) ? (String(value) as TMoodStringValue) : undefined}
      onUpdate={useFn((updated) => {
        onUpdate(Number(updated) as TMoodValue);
      })}
    />
  );
}
