declare module '*.wasm' {
  const value: string;
  export default value;
}

declare module '@duckdb/duckdb-wasm/dist/duckdb-browser' {
  export * from '@duckdb/duckdb-wasm';
}
