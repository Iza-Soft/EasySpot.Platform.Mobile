import { Text, TextProps } from "react-native";

export default function AppText({ children, style, ...props }: TextProps) {
  return (
    <Text allowFontScaling={false} style={style} {...props}>
      {children}
    </Text>
  );
}
