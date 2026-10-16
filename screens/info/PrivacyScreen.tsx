import React from "react";
import { useTranslation } from "react-i18next";
import { PrivacyPolicyText } from "../legal/PrivacyPolicyText";
import { InfoLayout } from "./InfoLayout";

/** Settings → Privacy policy (same text as at first start, in the app's theme). */
export default function PrivacyScreen() {
  const { t } = useTranslation();
  return (
    <InfoLayout screen={t("v2.privacy.screen")}>
      <PrivacyPolicyText />
    </InfoLayout>
  );
}
