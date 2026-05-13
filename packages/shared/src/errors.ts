export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, opts?: { code?: string; details?: unknown }) {
    super(message);
    this.status = status;
    this.code = opts?.code;
    this.details = opts?.details;
  }
}

export const httpError = (status: number, message: string, code?: string, details?: unknown) =>
  new HttpError(status, message, { code, details });
