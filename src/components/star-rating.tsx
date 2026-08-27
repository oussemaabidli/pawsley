import { memo } from "react";

export const StarRating = memo(function StarRating({
  rating,
  max = 5,
  className = "",
}: {
  rating: number;
  max?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <span className={className}>
      {"★".repeat(rounded)}
      <span className="text-muted-foreground/40">
        {"★".repeat(max - rounded)}
      </span>
    </span>
  );
});
