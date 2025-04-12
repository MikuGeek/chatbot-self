import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ErrorNotificationProps } from "@/types";

export const ErrorNotification = ({
  title = "错误",
  message,
  variant = "destructive"
}: ErrorNotificationProps) => (
  <Alert variant={variant} className="mb-4">
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

export default ErrorNotification;