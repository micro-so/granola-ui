import { File } from "@phosphor-icons/react";

export function ProfileFiles() {
  return (
    <section className="mt-6 flex min-h-[26rem] items-center justify-center rounded-xl border border-dashed border-foreground/20 bg-surface/20 px-6 py-12 text-center">
      <div className="flex max-w-md flex-col items-center">
        <div className="relative mb-8 h-16 w-20 text-placeholder">
          <File className="absolute left-1 top-2 h-14 w-14 -rotate-6" weight="thin" />
          <File className="absolute right-1 top-0 h-14 w-14 rotate-3" weight="thin" />
          <File className="absolute left-1/2 top-3 h-14 w-14 -translate-x-1/2" weight="thin" />
        </div>
        <h2 className="text-[15px] font-medium text-muted-foreground">
          Adding files gives more context to Ask Granola
        </h2>
        <p className="mt-1 text-[13px] text-placeholder">
          Drag &amp; drop files here to add them, or{" "}
          <span className="underline underline-offset-2">paste text</span>
        </p>
      </div>
    </section>
  );
}
