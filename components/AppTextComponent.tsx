import { Text, TextProps } from "react-native";

export default function AppText({ children, style, ...props }: TextProps) {
  return (
    <Text maxFontSizeMultiplier={1.0} style={style} {...props}>
      {children}
    </Text>
  );
}
