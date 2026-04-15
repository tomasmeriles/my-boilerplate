import { cn } from '~/lib/utils';
import { Spinner, type SpinnerProps } from './spinner';

interface LoaderProps extends SpinnerProps {
  /** Ocupa toda la pantalla y centra el spinner */
  fullScreen?: boolean;
  /** Ocupa el contenedor padre y centra el spinner */
  fullContainer?: boolean;
  label?: string;
}

export function Loader({
  fullScreen = false,
  fullContainer = false,
  label,
  size,
  className,
  ...props
}: LoaderProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <Spinner size={size} {...props} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  if (fullContainer) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center',
          className,
        )}
      >
        {spinner}
      </div>
    );
  }

  return <Spinner size={size} className={className} {...props} />;
}
