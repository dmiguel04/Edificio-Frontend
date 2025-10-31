const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4001;
app.use(cors());
app.use(bodyParser.json());

// Simple in-memory store for demo
const store = {
  treasuryAccounts: {},
  transactions: {},
};

app.post('/treasury/create_account', (req, res) => {
  const userId = req.body.userId || 'user_123';
  const connectedAccountId = `acct_mock_${Date.now()}`;
  const treasuryAccountId = `ta_mock_${Date.now()}`;
  store.treasuryAccounts[userId] = { connectedAccountId, treasuryAccountId };
  res.json({ connectedAccountId, treasuryAccountId, onboardingUrl: `https://dashboard.stripe.com/onboard/${connectedAccountId}` });
});

app.get('/treasury/balance', (req, res) => {
  const accountId = req.query.accountId || 'ta_mock_1';
  // mock balance
  res.json({ available: [{ amount: 12500, currency: 'usd' }] });
});

app.post('/treasury/issue_card', (req, res) => {
  const { accountId, cardholderName } = req.body;
  res.json({ cardId: `card_${Date.now()}`, ephemeralKey: `eph_${Math.random().toString(36).slice(2)}` });
});

app.post('/treasury/outbound_transfer', (req, res) => {
  const { accountId, amount, destination } = req.body;
  const transferId = `tr_${Date.now()}`;
  res.json({ transferId, status: 'processing' });
});

app.get('/treasury/transactions', (req, res) => {
  const accountId = req.query.accountId || 'ta_mock_1';
  res.json({ transactions: [
    { id: `txn_${Date.now()-1000}`, amount: 5000, currency: 'usd', description: 'Pago cuota', created_at: new Date(Date.now()-1000).toISOString() },
    { id: `txn_${Date.now()-2000}`, amount: -2500, currency: 'usd', description: 'Transferencia', created_at: new Date(Date.now()-2000).toISOString() }
  ] });
});

app.post('/payments/create_payment_intent', (req, res) => {
  const { amount } = req.body;
  // Return mock client_secret
  res.json({ client_secret: `pi_mock_${Date.now()}_secret_xxx`, paymentIntentId: `pi_mock_${Date.now()}` });
});

app.post('/payments/create_checkout_session', (req, res) => {
  res.json({ url: `https://checkout.stripe.com/pay/mock_session_${Date.now()}` });
});

app.get('/billing/invoices', (req, res) => {
  const userId = req.query.userId || 'user_123';
  res.json([
    { id: `inv_${Date.now()-5000}`, amount: 12000, due_date: new Date(Date.now()+86400000).toISOString() }
  ]);
});

app.listen(port, () => {
  console.log(`Mock server running on http://localhost:${port}`);
});
