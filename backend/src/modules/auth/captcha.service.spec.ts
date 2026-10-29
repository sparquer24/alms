import { CaptchaService } from './captcha.service';
import cache from '../../cache/cache';

describe('CaptchaService', () => {
  let service: CaptchaService;

  beforeEach(() => {
    service = new CaptchaService();
  });

  it('generates a captcha with captchaId and valid SVG markup', async () => {
    const result = await service.generateCaptcha();
    expect(result).toBeDefined();
    expect(result.captchaId).toBeDefined();
    expect(typeof result.captchaId).toBe('string');
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');
  });

  it('generates 6 characters with at least 2 numbers and remaining capital or small letters', async () => {
    for (let testRun = 0; testRun < 20; testRun++) {
      const { captchaId } = await service.generateCaptcha();
      const code = await cache.get<string>(`captcha:${captchaId}`);
      expect(code).toBeDefined();
      expect(code!.length).toBe(6);

      const digitCount = (code!.match(/[2-9]/g) || []).length;
      const letterCount = (code!.match(/[A-Za-z]/g) || []).length;

      // At least 2 numbers
      expect(digitCount).toBeGreaterThanOrEqual(2);
      // Other 4 are letters (capital or small)
      expect(letterCount).toBe(4);
    }
  });

  it('validates a correct captcha code preserving case', async () => {
    const { captchaId } = await service.generateCaptcha();
    const storedCode = await cache.get<string>(`captcha:${captchaId}`);
    expect(storedCode).toBeDefined();

    const validation = await service.validateCaptcha(captchaId, storedCode!);
    expect(validation.isValid).toBe(true);
  });

  it('is case-sensitive: rejects if letter case does not match', async () => {
    const { captchaId } = await service.generateCaptcha();
    const storedCode = await cache.get<string>(`captcha:${captchaId}`);
    expect(storedCode).toBeDefined();

    // Invert the case of the letters in the stored code
    const invertedCode = storedCode!
      .split('')
      .map(c => {
        if (/[A-Z]/.test(c)) return c.toLowerCase();
        if (/[a-z]/.test(c)) return c.toUpperCase();
        return c;
      })
      .join('');

    const validation = await service.validateCaptcha(captchaId, invertedCode);
    expect(validation.isValid).toBe(false);
    expect(validation.message).toContain('Incorrect CAPTCHA security code');
  });

  it('rejects an incorrect captcha code', async () => {
    const { captchaId } = await service.generateCaptcha();
    const validation = await service.validateCaptcha(captchaId, 'WRONG6');
    expect(validation.isValid).toBe(false);
    expect(validation.message).toContain('Incorrect CAPTCHA');
  });

  it('enforces single-use: cannot reuse the same captcha twice', async () => {
    const { captchaId } = await service.generateCaptcha();
    const storedCode = await cache.get<string>(`captcha:${captchaId}`);

    // First use: valid
    const firstCheck = await service.validateCaptcha(captchaId, storedCode!);
    expect(firstCheck.isValid).toBe(true);

    // Second use: already consumed
    const secondCheck = await service.validateCaptcha(captchaId, storedCode!);
    expect(secondCheck.isValid).toBe(false);
    expect(secondCheck.message).toContain('expired or is invalid');
  });

  it('rejects empty or missing parameters', async () => {
    const validation1 = await service.validateCaptcha(undefined, '123456');
    expect(validation1.isValid).toBe(false);

    const validation2 = await service.validateCaptcha('some-id', '');
    expect(validation2.isValid).toBe(false);
  });
});
