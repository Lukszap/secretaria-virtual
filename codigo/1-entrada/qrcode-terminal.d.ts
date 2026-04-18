declare module 'qrcode-terminal' {
  interface GenerateOptions {
    small?: boolean;
  }

  function generate(input: string, options?: GenerateOptions): void;

  const qrcode: {
    generate: typeof generate;
  };

  export = qrcode;
}
