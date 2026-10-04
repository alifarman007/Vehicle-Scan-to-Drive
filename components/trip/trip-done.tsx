"use client"

import { cn } from "cn"
import { Check, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useId, useRef, useState } from "react"
import { toast } from "sonner"

import { BottomBar } from "@/components/bottom-bar"
import { NavButton } from "@/components/nav-button"
import { ReviewSummary } from "@/components/review/review-summary"
import { StarRating } from "@/components/review/star-rating"
import { Stars } from "@/components/review/stars"
import { TagPicker } from "@/components/review/tag-picker"
import { SuccessCheck } from "@/components/success-check"
import { TripReceipt } from "@/components/trip/trip-receipt"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAction } from "@/hooks/use-action"
import { apiFetch, errorCode, errorMessage, postJson } from "@/lib/api-client"
import { firstName } from "@/lib/format"
import { MAX_COMMENT_LENGTH, tagsForRating, type ReviewTag } from "@/lib/review"
import { strings } from "@/lib/strings"
import type { Trip, TripResult } from "@/lib/types"

const t = strings.review
const HOME = "/passenger"

type View = "review" | "thanks" | "reviewed"

/** Which tag list a rating shows: 4–5 stars "went well", 1–3 "went wrong". */
const tagGroup = (rating: number) => (rating >= 4 ? "positive" : rating >= 1 ? "negative" : null)

/**
 * The passenger's end of a trip: the receipt and the review form, then a
 * thank-you. Opened again after rating, it shows the receipt and that rating.
 */
export function TripDone({ trip: initialTrip, renderedAt }: { trip: Trip; renderedAt: number }) {
  const [trip, setTrip] = useState(initialTrip)
  const [view, setView] = useState<View>(initialTrip.canReview ? "review" : "reviewed")
  // Only views we switch to here animate in; the first one arrives with the page transition.
  const [switched, setSwitched] = useState(false)

  function show(next: View, updated: Trip) {
    window.scrollTo({ top: 0 })
    setTrip(updated)
    setView(next)
    setSwitched(true)
  }

  const enter = switched ? "animate-screen-in" : undefined

  if (view === "thanks") return <Thanks rating={trip.review?.rating ?? null} className={enter} />
  if (view === "reviewed") return <Reviewed trip={trip} renderedAt={renderedAt} className={enter} />
  return (
    <ReviewForm
      trip={trip}
      renderedAt={renderedAt}
      onReviewed={(updated) => show("thanks", updated)}
      onAlreadyReviewed={(updated) => show("reviewed", updated)}
    />
  )
}

function Header() {
  return (
    <header className="flex flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+1.75rem)] text-center">
      <SuccessCheck className="size-16" />
      <h1 className="mt-3 text-[26px] leading-tight font-semibold tracking-tight">{strings.receipt.title}</h1>
    </header>
  )
}

function DoneButton() {
  return (
    <NavButton href={HOME} back size="xl">
      <Check />
      {strings.common.done}
    </NavButton>
  )
}

function ReviewForm({
  trip,
  renderedAt,
  onReviewed,
  onAlreadyReviewed,
}: {
  trip: Trip
  renderedAt: number
  onReviewed: (trip: Trip) => void
  onAlreadyReviewed: (trip: Trip) => void
}) {
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<ReviewTag[]>([])
  const [comment, setComment] = useState("")
  const titleId = useId()
  const commentId = useId()
  const title = useRef<HTMLHeadingElement>(null)

  function rate(next: number) {
    // The tags switch between "went well" and "went wrong": start that list fresh.
    if (tagGroup(next) !== tagGroup(rating)) setTags([])
    setRating(next)
    if (!rating) {
      // First pick: tags and comment appear below the stars, usually under the
      // bottom bar. Once they're rendered, bring the form up to the top.
      requestAnimationFrame(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        title.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" })
      })
    }
  }

  const router = useRouter()
  const [pending, submit] = useAction(async () => {
    if (!rating) return
    toast.dismiss("review")
    const allowed: readonly string[] = tagsForRating(rating)
    try {
      const { trip: updated } = await postJson<TripResult>(`/api/trips/${trip.id}/review`, {
        rating,
        tags: tags.filter((tag) => allowed.includes(tag)),
        comment: comment.trim(),
      })
      onReviewed(updated)
      // Drop cached pages (trip details, /done) that still offer "Rate this trip".
      router.refresh()
    } catch (err) {
      if (errorCode(err) !== "already_reviewed") {
        toast.error(errorMessage(err), { id: "review" })
        return
      }
      // Rated already (another tab, or a retry after a lost response): show that rating instead.
      const latest = await apiFetch<TripResult>(`/api/trips/${trip.id}`).then(
        (res) => res.trip,
        () => trip
      )
      toast.success(strings.errors.already_reviewed)
      onAlreadyReviewed(latest)
      router.refresh()
    }
  })

  return (
    <main className="flex flex-1 flex-col">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="flex flex-1 flex-col"
      >
        <Header />
        <div className="px-4 pt-5">
          <TripReceipt trip={trip} renderedAt={renderedAt} compact />
        </div>

        <section aria-labelledby={titleId} className="px-5 pt-7 text-center">
          {/* No sticky header here: the negative margin undoes most of the page's scroll padding. */}
          <h2
            ref={title}
            id={titleId}
            className="-scroll-mt-12 text-[22px] leading-tight font-semibold tracking-tight"
          >
            {t.title}
          </h2>
          <p className="mt-1 text-[16px] text-pretty text-muted-foreground">
            {t.subtitle(firstName(trip.driver.name))}
          </p>
          <StarRating className="mt-4" value={rating} onChange={rate} labelledBy={titleId} />
          <p
            aria-live="polite"
            className={cn("mt-1 min-h-6 text-[16px]", rating ? "font-semibold" : "text-muted-foreground")}
          >
            {rating ? t.ratingLabels[rating] : t.tapToRate}
          </p>
          {/* Until a star is picked there's nothing to submit: no bar covering
              the stars, just a quiet way out. */}
          {!rating ? (
            <NavButton href={HOME} back variant="ghost" size="lg" className="mx-auto mt-3 pb-safe">
              {t.skip}
            </NavButton>
          ) : null}
        </section>

        {rating ? (
          <div className="animate-rise px-5 pt-6 pb-4">
            {/* Keyed by group so a flip between the two lists fades the new one in. */}
            <TagPicker
              key={tagGroup(rating)}
              className="animate-fade-in text-center"
              rating={rating}
              value={tags}
              onChange={setTags}
            />
            <div className="mt-8 space-y-2">
              <div className="flex items-baseline justify-between gap-2 px-0.5">
                <Label htmlFor={commentId}>{t.commentLabel}</Label>
                <span className="text-[13px] text-subtle-foreground">{strings.common.optional}</span>
              </div>
              <Textarea
                id={commentId}
                name="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.commentPlaceholder}
                maxLength={MAX_COMMENT_LENGTH}
                rows={3}
                autoCapitalize="sentences"
                autoComplete="off"
                // Grows to a few lines, then scrolls inside, so the caret never slides under the bar.
                className="max-h-40 overflow-y-auto"
              />
              {comment.length > MAX_COMMENT_LENGTH - 100 ? (
                <p className="px-0.5 text-right text-[13px] text-muted-foreground tabular-nums">
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {rating ? (
          <BottomBar>
            <Button type="submit" size="xl" loading={pending}>
              <Star className="fill-current" />
              {t.submit}
            </Button>
            <NavButton href={HOME} back variant="ghost" size="lg" className="w-full" disabled={pending}>
              {t.skip}
            </NavButton>
          </BottomBar>
        ) : null}
      </form>
    </main>
  )
}

function Thanks({ rating, className }: { rating: number | null; className?: string }) {
  // The form that had focus is gone: move it to the heading so screen readers announce the new screen.
  const focusHeading = useCallback((el: HTMLHeadingElement | null) => el?.focus({ preventScroll: true }), [])
  return (
    <main className={cn("flex flex-1 flex-col", className)}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-safe text-center">
        <SuccessCheck />
        <h1
          ref={focusHeading}
          tabIndex={-1}
          className="mt-5 animate-rise text-[28px] leading-tight font-semibold tracking-tight outline-none"
        >
          {t.thanksTitle}
        </h1>
        <p className="mt-2 max-w-[32ch] animate-rise text-[16px] text-pretty text-muted-foreground">{t.thanksBody}</p>
        {rating ? <Stars rating={rating} size="lg" className="mt-5 animate-rise [animation-delay:120ms]" /> : null}
      </div>
      <BottomBar>
        <DoneButton />
      </BottomBar>
    </main>
  )
}

function Reviewed({ trip, renderedAt, className }: { trip: Trip; renderedAt: number; className?: string }) {
  return (
    <main className={cn("flex flex-1 flex-col", className)}>
      <Header />
      <div className="px-4 pt-6">
        <TripReceipt trip={trip} renderedAt={renderedAt} />
      </div>
      {trip.review ? <ReviewSummary className="px-4 pt-9 pb-4" review={trip.review} /> : null}
      <BottomBar>
        <DoneButton />
      </BottomBar>
    </main>
  )
}
