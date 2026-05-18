import React from "react";
import { AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";

export function FormField({
  label,
  error,
  counter,
  optional,
  required,
  children,
}: {
  label: string;
  error?: string;
  counter?: string;
  optional?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
          {optional && (
            <span className="text-muted-foreground font-normal text-xs ml-1">(opcional)</span>
          )}
        </label>
        {counter && <span className="text-[10px] text-muted-foreground">{counter}</span>}
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectionPills({
  label,
  selected,
  entries,
  onSelect,
  selectedClassName,
  defaultClassName,
}: {
  label: string;
  selected: string;
  entries: Array<[string, string]>;
  onSelect: (value: string) => void;
  selectedClassName: string;
  defaultClassName: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([key, itemLabel]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
              selected === key ? selectedClassName : defaultClassName,
            )}
          >
            {itemLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EditableChipList({
  label,
  icon,
  inputValue,
  items,
  placeholder,
  onInputChange,
  onAdd,
  onRemove,
  chipClassName,
}: {
  label: string;
  icon: React.ReactNode;
  inputValue: string;
  items: string[];
  placeholder: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  chipClassName: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
          className="h-11 text-sm rounded-xl flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={onAdd} className="rounded-xl h-11 px-3">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className={chipClassName}>
              {item}
              <button onClick={() => onRemove(index)} aria-label={`Remover ${item}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditableBulletList({
  label,
  icon,
  inputValue,
  items,
  placeholder,
  onInputChange,
  onAdd,
  onRemove,
}: {
  label: string;
  icon: React.ReactNode;
  inputValue: string;
  items: string[];
  placeholder: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
          className="h-11 text-sm rounded-xl flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={onAdd} className="rounded-xl h-11 px-3">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1.5 mt-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="text-xs text-muted-foreground flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span className="text-accent">•</span>
                {item}
              </span>
              <button onClick={() => onRemove(index)} aria-label={`Remover ${item}`}>
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
