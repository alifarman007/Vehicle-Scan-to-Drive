/** Review tag keys. Labels live in `strings.review.tags` so they can be translated. */
export const POSITIVE_TAGS = ["safe_driving", "on_time", "clean_car", "polite", "smooth_ride"] as const
export const NEGATIVE_TAGS = [
  "late",
  "rash_driving",
  "dirty_car",
  "rude",
  "wrong_route",
  "ac_not_working",
] as const

export type ReviewTag = (typeof POSITIVE_TAGS)[number] | (typeof NEGATIVE_TAGS)[number]

/** 4–5 stars get the positive tags, 1–3 get the negative ones. */
export function tagsForRating(rating: number): readonly ReviewTag[] {
  if (rating >= 4) return POSITIVE_TAGS
  if (rating >= 1) return NEGATIVE_TAGS
  return []
}

export const MAX_COMMENT_LENGTH = 500
