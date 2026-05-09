import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({ value = 0, onChange, readonly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hover || value);
        
        return (
          <button
            key={star}
            type="button"
            data-testid={`star-${star}`}
            disabled={readonly}
            onClick={() => !readonly && onChange && onChange(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`transition-colors ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              size={32}
              className={isFilled ? 'fill-[#C8F135] text-[#C8F135]' : 'text-gray-300'}
            />
          </button>
        );
      })}
    </div>
  );
};
