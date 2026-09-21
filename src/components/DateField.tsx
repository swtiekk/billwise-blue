import React, { useState } from "react";
import { View, Pressable, Platform, StyleSheet } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { CalendarDays } from "lucide-react-native";
import { C } from "../theme";
import { Text } from "../ui/Text";
import { FL, Btn } from "./Atoms";
import { Sheet } from "./Sheet";
import { formatLong, fromISO, toISO } from "../utils/dates";

/** Date picker that looks like <Field>. `value` and `onChange` use YYYY-MM-DD strings. */
export function DateField({
  label,
  value,
  onChange,
  minimumDate,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? fromISO(value) : new Date();

  const handle = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === "android") setOpen(false); // Android shows a dialog that closes itself
    if (event.type === "set" && picked) onChange(toISO(picked));
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <FL>{label}</FL>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={{ fontSize: 15, color: value ? C.text : "#9DB0D6" }}>{value ? formatLong(value) : "Select date"}</Text>
        <CalendarDays size={18} color={C.primary} />
      </Pressable>

      {Platform.OS === "android" && open ? (
        <DateTimePicker value={date} mode="date" minimumDate={minimumDate} onChange={handle} />
      ) : null}

      {Platform.OS === "ios" ? (
        <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
          <DateTimePicker value={date} mode="date" display="inline" minimumDate={minimumDate} onChange={handle} />
          <View style={{ marginTop: 8 }}>
            <Btn onPress={() => setOpen(false)}>Done</Btn>
          </View>
        </Sheet>
      ) : null}
    </View>
  );
}

// same look as the input in Atoms.tsx
const styles = StyleSheet.create({
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1.5,
    borderColor: "#D3E1FA",
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
