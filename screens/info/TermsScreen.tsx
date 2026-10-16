import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "../../ui";
import { InfoLayout, InfoSection } from "./InfoLayout";

const SECTIONS = ["what", "data", "guarantee", "liability", "changes", "contact"] as const;

/** Settings → Terms of service (mockup U1). */
export default function TermsScreen() {
  const { t } = useTranslation();
  return (
    <InfoLayout screen={t("v2.terms.screen")}>
      <Text variant="title" accessibilityRole="header">{t("v2.terms.title")}</Text>
      <Text variant="small" tone="muted">{t("v2.terms.effective")}</Text>
      {SECTIONS.map((s) => (
        <InfoSection key={s} title={t(`v2.terms.s_${s}_h`)} body={t(`v2.terms.s_${s}`)} />
      ))}
    </InfoLayout>
  );
}
