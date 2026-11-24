export interface ValidationIssue {
  /** Dotted path to the field, matching React Hook Form field names, for example `headers.2.key`. Empty for the whole request. */
  path: string;
  message: string;
}
