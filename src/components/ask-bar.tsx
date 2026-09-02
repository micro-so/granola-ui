import { CaretDown, Microphone, Paperclip, SquaresFour } from "@phosphor-icons/react";
import { SquareSlash } from "lucide-react";
import type { ReactNode } from "react";
import { MutedAction } from "@/components/chrome";

const recipes = ["Prep next meeting", "List outstanding items", "Coach me Matt"];

export function AskField({
  placeholder,
  children,
  className = "",
}: {
  placeholder: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-[60px] items-center rounded-full border border-foreground/12 bg-surface px-5 ${className}`}
    >
      <input
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-placeholder"
      />
      {children}
    </div>
  );
}

export function DockedAsk({ placeholder = "Ask anything" }: { placeholder?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-6">
      <AskField
        placeholder={placeholder}
        className="pointer-events-auto w-full max-w-[720px] shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
      >
        <MutedAction className="h-9 gap-2 px-3.5 text-[13px] text-heading ring-1 ring-inset ring-foreground/[0.08]">
          <SquareSlash className="h-3.5 w-3.5" strokeWidth={1.75} />
          List recent todos
        </MutedAction>
      </AskField>
    </div>
  );
}

export function AskBar({ placeholder }: { placeholder: string }) {
  return (
    <div className="mt-8">
      <AskField placeholder={placeholder}>
        <button type="button" className="mr-2 flex items-center gap-1 text-[13px] text-muted-foreground">
          Auto
          <CaretDown className="h-3 w-3" />
        </button>
        <button type="button" aria-label="Attach" className="mr-1 flex h-8 w-8 items-center justify-center text-nav">
          <Paperclip className="h-4 w-4" />
        </button>
        <MutedAction label="Dictate" className="h-9 w-9 text-muted-foreground">
          <Microphone className="h-4 w-4" />
        </MutedAction>
      </AskField>

      <div className="mt-3 flex items-center gap-5">
        {recipes.map((label) => (
          <button
            key={label}
            type="button"
            className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <SquareSlash className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <SquaresFour className="h-3.5 w-3.5" />
          All recipes
        </button>
      </div>
    </div>
  );
}
