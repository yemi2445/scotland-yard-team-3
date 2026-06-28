const GamePinFormat = /^\d{4,6}$/;

export function isValidGamePin(pin: string): boolean {
    return GamePinFormat.test(pin);
}

export function formatGamePin(pin: string): string {
    const digits = pin.replace(/\D/g, "").slice(0, 6);
    return digits;
}

export function generateRandomGamePin(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    return randomDigits;
}