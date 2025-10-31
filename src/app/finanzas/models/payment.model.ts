export interface PaymentIntentResponse {
  client_secret: string;
  id: string;
  payment_id: number;
  next_action?: any;
}
