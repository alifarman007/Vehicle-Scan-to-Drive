import { Stars } from "@/components/review/stars"
import { TagChip } from "@/components/review/tag-chip"
import { SectionTitle } from "@/components/top-bar"
import { strings } from "@/lib/strings"
import type { TripReview } from "@/lib/types"

/** "Your rating": the passenger's own review, read-only. */
export function ReviewSummary({ review, className }: { review: TripReview; className?: string }) {
  const label = strings.review.ratingLabels[review.rating] ?? ""
  return (
    <section className={className}>
      <SectionTitle>{strings.review.rated}</SectionTitle>
      <div className="rounded-3xl border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Stars rating={review.rating} size="lg" />
          {label ? <span className="text-[17px] font-semibold">{label}</span> : null}
        </div>
        {review.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {review.tags.map((tag) => (
              <li key={tag}>
                <TagChip tag={tag} />
              </li>
            ))}
          </ul>
        ) : null}
        {review.comment ? (
          <p className="mt-4 border-l-2 border-rule pl-3 text-[16px] whitespace-pre-line break-words">
            {review.comment}
          </p>
        ) : null}
      </div>
    </section>
  )
}
