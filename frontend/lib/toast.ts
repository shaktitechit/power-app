import { toast } from "sonner";

const getErrorMessage = (error: any): string => {
  if (!error) return "Something went wrong.";

  if (error?.data?.message) return error.data.message;
  if (error?.error) return error.error;
  if (error?.message) return error.message;

  return "Something went wrong. Please try again.";
};

export const toastHandler = async <T>({
  action,
  loading,
  success,
}: {
  action: () => Promise<T>;
  loading: string;
  success: string;
}) => {
  const id = toast.loading(loading);

  try {
    const result = await action();
    toast.success(success, { id });
    return result;
  } catch (error) {
    toast.error(getErrorMessage(error), { id });
    throw error;
  }
};