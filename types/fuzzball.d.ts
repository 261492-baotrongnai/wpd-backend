declare module 'fuzzball' {
  export function extract(
    query: string,
    choices: string[],
    options?: {
      scorer?: (a: string, b: string) => number;
      processor?: (input: string) => string;
      limit?: number;
      cutoff?: number;
    },
  ): [string, number][];

  export function ratio(a: string, b: string): number;
  export function partial_ratio(a: string, b: string): number;
  export function token_sort_ratio(a: string, b: string): number;
  export function token_set_ratio(a: string, b: string): number;
}
