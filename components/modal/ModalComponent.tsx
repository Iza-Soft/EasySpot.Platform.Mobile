import { ReactNode } from "react";
import { Modal, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors } from "../../themes/main";
import { useTranslation } from "react-i18next";
import AppText from "../AppTextComponent";

type WidthType = number | `${number}%`;

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children?: ReactNode;
  width?: WidthType;
  canClose?: boolean;
}

export default function ModalComponent({
  visible,
  onClose,
  children,
  width = "100%",
  canClose = true,
}: ModalProps) {
  const { t: localize } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { width }]}>
          {children}

          <TouchableOpacity
            onPress={() => {
              if (canClose) {
                onClose();
              }
            }}
            style={[styles.closeBtn, { opacity: canClose ? 1 : 0.4 }]}
          >
            <AppText style={styles.closeText}>
              {canClose ?
                localize("common.close")
              : localize("common.accept_to_continue")}
            </AppText>
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
    maxHeight: "90%",
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
