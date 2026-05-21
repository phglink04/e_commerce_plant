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
    { label: "Tất cả", value: undefined },
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
      </div>

      <div className="review-filters__bottom">
        <span className="review-filters__count">{totalResults} đánh giá</span>
        <select
          className="review-filters__sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="highest">Đánh giá cao</option>
          <option value="lowest">Đánh giá thấp</option>
          <option value="most_liked">Yêu thích nhất</option>
        </select>
      </div>
    </div>
  );
}
