"use client";

interface Props {
  activeRating?: number;
  withImages: boolean;
  verifiedOnly: boolean;
  sortBy: string;
  onRatingFilter: (rating?: number) => void;
  onWithImagesToggle: () => void;
  onVerifiedToggle: () => void;
  onSortChange: (sort: string) => void;
  totalResults: number;
}

export default function ReviewFilters({
  activeRating, withImages, verifiedOnly, sortBy,
  onRatingFilter, onWithImagesToggle, onVerifiedToggle, onSortChange, totalResults,
}: Props) {
  const ratingOptions = [
    { label: "All", value: undefined },
    { label: "5 ★", value: 5 },
    { label: "4 ★", value: 4 },
    { label: "3 ★", value: 3 },
    { label: "2 ★", value: 2 },
    { label: "1 ★", value: 1 },
  ];

  return (
    <div className="review-filters">
      <div className="review-filters__row">
        <div className="review-filters__rating-chips">
          {ratingOptions.map((opt) => (
            <button
              key={opt.label}
              className={`review-filters__chip ${activeRating === opt.value ? "review-filters__chip--active" : ""} ${opt.value === undefined && activeRating === undefined ? "review-filters__chip--active" : ""}`}
              onClick={() => onRatingFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="review-filters__toggles">
          <button
            className={`review-filters__chip ${withImages ? "review-filters__chip--active" : ""}`}
            onClick={onWithImagesToggle}
          >
            📷 With Images
          </button>
          <button
            className={`review-filters__chip ${verifiedOnly ? "review-filters__chip--active" : ""}`}
            onClick={onVerifiedToggle}
          >
            ✓ Verified
          </button>
        </div>
      </div>

      <div className="review-filters__bottom">
        <span className="review-filters__count">{totalResults} review{totalResults !== 1 ? "s" : ""}</span>
        <select
          className="review-filters__sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
          <option value="most_liked">Most Liked</option>
        </select>
      </div>
    </div>
  );
}
