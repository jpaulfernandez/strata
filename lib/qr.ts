import * as QRCode from 'qrcode';

/**
 * Options for QR code generation
 */
export interface QRCodeOptions {
  /** Width of the QR code in pixels. Default: 300 */
  width?: number;
  /** Margin around the QR code. Default: 2 */
  margin?: number;
  /** Error correction level. Default: 'M' */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

// Color scheme from DESIGN.md
const QR_DARK_COLOR = '#1a1c1d'; // on-surface
const QR_LIGHT_COLOR = '#ffffff';

const DEFAULT_OPTIONS: Required<Omit<QRCodeOptions, 'errorCorrectionLevel'>> & { errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' } = {
  width: 300,
  margin: 2,
  errorCorrectionLevel: 'M',
};

/**
 * Generates a QR code as a base64 PNG data URL
 *
 * @param data - The data to encode in the QR code
 * @param options - QR code generation options
 * @returns Promise resolving to a base64 PNG data URL string
 *
 * @example
 * ```ts
 * const dataUrl = await generateQRCode('https://example.com');
 * // Use in an <img src={dataUrl} /> element
 * ```
 */
export async function generateQRCode(
  data: string,
  options?: QRCodeOptions
): Promise<string> {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    color: {
      dark: QR_DARK_COLOR,
      light: QR_LIGHT_COLOR,
    },
  };

  return QRCode.toDataURL(data, mergedOptions);
}

/**
 * Generates a QR code as an SVG string
 *
 * @param data - The data to encode in the QR code
 * @param options - QR code generation options
 * @returns Promise resolving to an SVG string
 *
 * @example
 * ```tsx
 * const svg = await generateQRCodeSVG('https://example.com');
 * // Render in React: <div dangerouslySetInnerHTML={{ __html: svg }} />
 * ```
 */
export async function generateQRCodeSVG(
  data: string,
  options?: QRCodeOptions
): Promise<string> {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    color: {
      dark: QR_DARK_COLOR,
      light: QR_LIGHT_COLOR,
    },
  };

  return QRCode.toString(data, { ...mergedOptions, type: 'svg' });
}

/**
 * Convenience function to generate a QR code for a URL
 *
 * @param url - The URL to encode in the QR code
 * @param options - QR code generation options
 * @returns Promise resolving to a base64 PNG data URL string
 *
 * @example
 * ```ts
 * const qrDataUrl = await generateQRCodeForUrl('https://strata.app/event/123');
 * ```
 */
export async function generateQRCodeForUrl(
  url: string,
  options?: QRCodeOptions
): Promise<string> {
  return generateQRCode(url, options);
}