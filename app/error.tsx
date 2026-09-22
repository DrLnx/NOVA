'use client';

import { ErrorBody } from '@/components/StatusPages';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorBody reset={reset} />;
}
