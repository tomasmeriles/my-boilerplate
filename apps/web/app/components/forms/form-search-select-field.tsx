import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import {
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import { Button } from '~/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { useDebounce } from '~/hooks/use-debounce';
import { cn } from '~/lib/utils';

interface FormSearchSelectFieldProps<
  T,
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  /** Pass empty string to render without a label (compact rows). */
  label: string;
  optional?: boolean;
  items?: T[];
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
  /**
   * Async fetcher — component owns search state internally (no external useState needed).
   * Takes priority over `items` + `onSearch` when provided.
   */
  fetchItems?: (query: string) => Promise<T[]>;
  /**
   * Fetches a single item by ID. Called once on mount when the pre-selected value is
   * not found in the initial empty-query results (i.e. item is beyond the first page).
   * Skipped entirely when the item IS in the first-page results — no double fetch.
   */
  fetchItemById?: (id: string) => Promise<T>;
  /**
   * Called with the debounced search string — drives server-side filtering.
   * When omitted, items are filtered client-side by label.
   */
  onSearch?: (query: string) => void;
  debounceMs?: number;
  isLoading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** When true, auto-selects the item if exactly one option is available and the field is empty. */
  autoSelectSingle?: boolean;
  /**
   * Item to inject into the resolved list (e.g. a freshly created record). Prepended if not
   * already present. Lets the combobox show the correct label without a round-trip fetch.
   */
  seedItem?: T;
  /**
   * Label pre-computado para el item seleccionado al montar (modo edición).
   * Si se provee, se muestra directamente y se omite el mount fetch.
   * El fetch normal ocurre cuando el usuario abre el dropdown.
   */
  initialDisplayLabel?: string;
  /** Rendered inside CommandList after the main results group. Use for "create new" actions. */
  footerGroup?: React.ReactNode;
}

export function FormSearchSelectField<
  T,
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  optional,
  items,
  getItemId,
  getItemLabel,
  renderItem,
  fetchItems,
  fetchItemById,
  onSearch,
  debounceMs = 300,
  isLoading,
  placeholder = 'Seleccioná…',
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Sin resultados.',
  disabled,
  autoSelectSingle,
  seedItem,
  initialDisplayLabel,
  footerGroup,
}: FormSearchSelectFieldProps<T, TFieldValues, TName>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, debounceMs);

  const [asyncItems, setAsyncItems] = useState<T[]>([]);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const fetchItemsRef = useRef(fetchItems);
  fetchItemsRef.current = fetchItems;
  const fetchItemByIdRef = useRef(fetchItemById);
  fetchItemByIdRef.current = fetchItemById;
  const getItemIdRef = useRef(getItemId);
  getItemIdRef.current = getItemId;
  const [resolvedInitialItem, setResolvedInitialItem] = useState<T | undefined>(undefined);
  const selectedLabelRef = useRef<string | null>(null);
  // Synced from the render prop so the mount effect can read the initial value.
  const fieldValueRef = useRef<string>('');
  const fieldOnChangeRef = useRef<((v: string) => void) | null>(null);
  const prevItemsLengthRef = useRef<number>(-1);

  // One-time mount fetch: resolves the display label for a pre-selected value
  // (e.g. edit mode). Empty fields skip this entirely.
  // If initialDisplayLabel is provided, the label is already known — skip the fetch entirely.
  // If the value is not found in the first-page results and fetchItemById is provided,
  // fires a targeted getOne call — avoiding a double fetch when item IS on first page.
  useEffect(() => {
    if (!fetchItemsRef.current || !fieldValueRef.current) return;
    if (initialDisplayLabel !== undefined) {
      selectedLabelRef.current = initialDisplayLabel;
      return;
    }
    let cancelled = false;
    fetchItemsRef.current('').then((data) => {
      if (cancelled) return;
      setAsyncItems(data);
      if (
        fetchItemByIdRef.current &&
        fieldValueRef.current &&
        !data.some((i) => getItemIdRef.current(i) === fieldValueRef.current)
      ) {
        fetchItemByIdRef.current(fieldValueRef.current)
          .then((item) => { if (!cancelled) setResolvedInitialItem(item); })
          .catch(() => {});
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search fetch: only fires while the popover is open.
  useEffect(() => {
    if (!fetchItemsRef.current || !open) return;
    let cancelled = false;
    setAsyncLoading(true);
    fetchItemsRef.current(debouncedSearch)
      .then((data) => { if (!cancelled) { setAsyncItems(data); setAsyncLoading(false); } })
      .catch(() => { if (!cancelled) setAsyncLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedSearch, open]);

  useEffect(() => {
    onSearch?.(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  const baseItems = fetchItems ? asyncItems : (items ?? []);
  const resolvedItems =
    seedItem && !baseItems.some((i) => getItemId(i) === getItemId(seedItem))
      ? [seedItem, ...baseItems]
      : baseItems;

  useEffect(() => {
    const only = resolvedItems[0];
    const prevLength = prevItemsLengthRef.current;
    prevItemsLengthRef.current = resolvedItems.length;

    if (!autoSelectSingle || resolvedItems.length !== 1 || !only || fieldValueRef.current) return;
    if (prevLength === 1) return;
    fieldOnChangeRef.current?.(getItemId(only));
  }, [autoSelectSingle, resolvedItems, getItemId]);
  const resolvedLoading = fetchItems ? asyncLoading : isLoading;

  // Client-side filter when no server search is configured.
  const filteredItems = (fetchItems ?? onSearch)
    ? resolvedItems
    : resolvedItems.filter((i) =>
        getItemLabel(i).toLowerCase().includes(search.toLowerCase()),
      );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        fieldValueRef.current = field.value as string;
        fieldOnChangeRef.current = field.onChange;
        const selectedItem =
          resolvedItems.find((i) => getItemId(i) === field.value) ??
          (resolvedInitialItem !== undefined && getItemId(resolvedInitialItem) === field.value
            ? resolvedInitialItem
            : undefined);
        if (selectedItem) {
          selectedLabelRef.current = getItemLabel(selectedItem);
        }
        const displayLabel = selectedItem
          ? getItemLabel(selectedItem)
          : field.value ? selectedLabelRef.current : null;

        const handleSelect = (id: string) => {
          field.onChange(id === field.value ? '' : id);
          setOpen(false);
        };

        return (
          <FormItem>
            {label && (
              <FormLabel>
                {label}
                {optional && (
                  <span className="text-[11px] font-normal text-muted-foreground/60 tracking-wide">
                    opcional
                  </span>
                )}
              </FormLabel>
            )}
            <div className="relative">
              <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      'w-full justify-between font-normal',
                      !displayLabel && 'text-muted-foreground',
                      displayLabel && 'pr-8',
                    )}
                  >
                    <span className="flex-1 truncate text-left">
                      {displayLabel ?? placeholder}
                    </span>
                    {!displayLabel && (
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
                side="bottom"
                avoidCollisions={true}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={searchPlaceholder}
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {resolvedLoading ? 'Cargando…' : emptyMessage}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredItems.map((item) => {
                        const id = getItemId(item);
                        return (
                          <CommandItem key={id} value={id} onSelect={handleSelect}>
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4 shrink-0',
                                field.value === id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {renderItem ? renderItem(item) : getItemLabel(item)}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                    {footerGroup && <CommandSeparator />}
                    {footerGroup}
                  </CommandList>
                </Command>
              </PopoverContent>
              </Popover>
              {displayLabel && !disabled && (
                <button
                  type="button"
                  aria-label="Limpiar selección"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
                  onClick={() => field.onChange('')}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
