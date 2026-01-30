interface StatusBarProps {
  message: string;
}

export function StatusBar({ message }: StatusBarProps) {
  return <div id="status">{message}</div>;
}
