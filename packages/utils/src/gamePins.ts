const GamePinFormat = /^\d{3}-\d{3}$/;

export function isValidGamePin(pin: string): boolean {
    return GamePinFormat.test(pin);
}

export function formatGamePin(pin: string): string {
    const digits = pin.replace(/\D/g, "").slice(0, 6);
    if (digits.length < 4) {
        return digits;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

export function generateRandomGamePin(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    return `${randomDigits.slice(0, 3)}-${randomDigits.slice(3)}`;
}
