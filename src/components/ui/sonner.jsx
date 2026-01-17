import { Toaster as Sonner, toast } from "sonner";

const Toaster = (props) => {
  return (
    <Sonner
      richColors
      position="top-right"
      className="toaster"
      toastOptions={{
        classNames: {
          toast:
            "bg-background text-foreground border border-border shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
