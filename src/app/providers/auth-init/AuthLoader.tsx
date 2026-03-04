import { Spinner } from "@/components/ui/spinner";

const AuthLoader = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-muted-foreground text-sm">Загрузка...</p>
      </div>
    </div>
  );
};

export default AuthLoader;
