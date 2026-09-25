export const currencies = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "JPY"] as const;
export type Currency = (typeof currencies)[number];

export function formatMoney(amount: number | string, currency: string) {
  const safeCurrency = currencies.includes(currency as Currency) ? currency : "INR";
  return new Intl.NumberFormat(safeCurrency === "INR" ? "en-IN" : "en", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function currencySymbol(currency: string) {
  const safeCurrency = currencies.includes(currency as Currency) ? currency : "INR";
  return new Intl.NumberFormat(safeCurrency === "INR" ? "en-IN" : "en", {
    style: "currency",
    currency: safeCurrency,
  }).formatToParts(0).find((part) => part.type === "currency")?.value ?? safeCurrency;
}
