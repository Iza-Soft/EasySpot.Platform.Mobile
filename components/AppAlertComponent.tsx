import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { colors } from "../themes/main";

interface AlertButton {
  text: string;
  onPress: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AppAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onClose: () => void;
}

export default function AppAlertComponent({
  visible,
  title,
  message,
  buttons,
  onClose,
}: AppAlertProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.box}>
          <Text style={styles.title} maxFontSizeMultiplier={1.0}>
            {title}
          </Text>
          <Text style={styles.message} maxFontSizeMultiplier={1.0}>
            {message}
          </Text>

          <View style={styles.divider} />

          <View style={styles.buttons}>
            {buttons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.btn,
                  btn.style === "cancel" && styles.btnCancel,
                  btn.style === "destructive" && styles.btnDestructive,
                  btn.style === "default" && styles.btnDefault,
                ]}
                onPress={() => {
                  onClose();
                  btn.onPress();
                }}
              >
                <Text
                  style={[
                    styles.btnText,
                    btn.style === "cancel" && styles.btnTextCancel,
                    btn.style === "destructive" && styles.btnTextDestructive,
                    btn.style === "default" && styles.btnTextDefault,
                  ]}
                  maxFontSizeMultiplier={1.0}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  box: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDestructive: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  btnDefault: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "500",
  },
  btnTextCancel: {
    color: colors.muted,
  },
  btnTextDestructive: {
    color: colors.danger,
    fontWeight: "600",
  },
  btnTextDefault: {
    color: colors.tab,
    fontWeight: "600",
  },
});
