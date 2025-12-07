import { ReactNode } from "react";
import { Modal, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors } from "../../themes/main";

type WidthType = number | `${number}%`;

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children?: ReactNode;
  width?: WidthType;
}

export default function ModalComponent({
  visible,
  onClose,
  children,
  width = "100%",
}: ModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { width }]}>
          {children}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  closeBtn: {
    marginTop: 2,
    padding: 12,
    borderWidth: 0.5,
    borderColor: colors.tab,
    borderRadius: 8,
  },
  closeText: {
    textAlign: "center",
    color: "red",
  },
});
