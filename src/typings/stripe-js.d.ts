declare module '@stripe/stripe-js' {
	export type Stripe = any;
	export function loadStripe(key: string, options?: any): Promise<Stripe | null>;
}

