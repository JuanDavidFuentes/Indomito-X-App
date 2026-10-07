import { VALIDATION_PARAMS } from '@juandavidfuentes/indomitox-shared';
import { useTranslation } from 'react-i18next';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';

/**
 * Traduce los errores: los esquemas Zod de shared usan claves `validation.*` como mensaje
 * y la API responde con códigos `errors.*` (igual que en la web).
 */
export function useErrorText() {
  const { t, i18n } = useTranslation();
  return {
    field(message: string | undefined): string | undefined {
      if (!message) return undefined;
      return t(i18n.exists(message) ? message : 'validation.invalid', VALIDATION_PARAMS);
    },
    api(error: unknown): string {
      return t(`errors.${error instanceof ApiError ? error.code : 'INTERNAL_ERROR'}`);
    },
  };
}

/** Lleva los errores de validación de la API a los campos; true si había alguno. */
export function applyApiIssues<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): boolean {
  if (!(error instanceof ApiError) || error.issues.length === 0) return false;
  for (const issue of error.issues) {
    setError(issue.path as Path<T>, { type: 'server', message: issue.message });
  }
  return true;
}
