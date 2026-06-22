import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  options?: number[];
};

export function Pager({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  options = [5, 10, 20, 50],
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-6 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="bg-card border border-border rounded-lg px-2 py-1 text-sm font-semibold outline-none focus:border-brand"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span>
          per page · {start}–{end} of {total}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="size-9 grid place-items-center rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs font-semibold text-muted-foreground">
          Page {safePage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          className="size-9 grid place-items-center rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
