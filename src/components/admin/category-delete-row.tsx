'use client'

import { useRouter } from 'next/navigation'
import { CategoryDeleteButton } from './category-delete-button'

interface Props {
  categoryId: string
  categoryName: string
}

export function CategoryDeleteRow({ categoryId, categoryName }: Props) {
  const router = useRouter()
  return (
    <CategoryDeleteButton
      categoryId={categoryId}
      categoryName={categoryName}
      onDeleted={() => router.refresh()}
    />
  )
}
