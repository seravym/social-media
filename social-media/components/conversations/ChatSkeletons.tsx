"use client";

export function ChatListSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-3 rounded-xl p-2"
        >
          <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3.5 w-28 rounded-full bg-slate-200" />
              <div className="h-3 w-10 rounded-full bg-slate-200" />
            </div>
            <div className="h-3 w-44 rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageAreaSkeleton() {
  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="flex flex-col gap-4">
        <div className="flex animate-pulse items-end gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-200" />
          <div className="h-12 w-52 rounded-2xl bg-slate-200" />
        </div>
        <div className="flex animate-pulse justify-end">
          <div className="h-10 w-44 rounded-2xl bg-pink-100" />
        </div>
        <div className="flex animate-pulse items-end gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-200" />
          <div className="h-16 w-64 rounded-2xl bg-slate-200" />
        </div>
        <div className="flex animate-pulse justify-end">
          <div className="h-12 w-56 rounded-2xl bg-pink-100" />
        </div>
      </div>
    </div>
  );
}