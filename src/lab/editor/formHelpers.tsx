import { useId, type ReactNode } from 'react'
import { attributeSchema, type Attribute } from '../../api/catalog'
import type { ContentInvalidDetails } from '../../api/editor'
import { termCatalog } from '../../ui/terms'

/** Partes dos formulários do editor (carta e classe) que não são componentes. */

export type FieldErrors = ContentInvalidDetails['fields']

/**
 * Liga os textos de erro de `details.fields` ao campo do mesmo caminho
 * (D-38): `describedBy(path)` vai no campo, `errorText(path)` logo abaixo.
 */
export function useFieldErrors(fields: FieldErrors) {
  const base = useId()
  const idOf = (path: string) => `${base}-${path.replaceAll('.', '-')}-error`
  const messages = (path: string, includeChildren = false) =>
    fields
      .filter(
        (f) =>
          f.path === path || (includeChildren && f.path.startsWith(path + '.')),
      )
      .map((f) => (f.path === path ? f.message : `${f.path}: ${f.message}`))
  return {
    describedBy: (path: string, includeChildren?: boolean) =>
      messages(path, includeChildren).length > 0 ? idOf(path) : undefined,
    errorText: (path: string, includeChildren?: boolean): ReactNode => {
      const list = messages(path, includeChildren)
      return list.length > 0 ? <p id={idOf(path)}>{list.join(' ')}</p> : null
    },
  }
}

export type Errors = ReturnType<typeof useFieldErrors>

export function options<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): { value: T; label: string }[] {
  return values.map((value) => ({ value, label: labels[value] }))
}

export const attributeOptions = options(
  attributeSchema.options,
  Object.fromEntries(
    attributeSchema.options.map((a) => [a, termCatalog[a].name]),
  ) as Record<Attribute, string>,
)
