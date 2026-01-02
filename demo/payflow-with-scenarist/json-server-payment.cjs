// Custom payment middleware for json-server
// Returns proper payment response format for POST /payments
module.exports = (req, res, next) => {
  if (req.method === 'POST' && req.url === '/payments') {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();

    // Return success response
    const response = {
      id: paymentId,
      status: 'succeeded',
      amount: req.body.amount || 0,
      currency: req.body.currency || 'usd',
      createdAt,
    };

    // Also store the payment in the database
    req.body.id = paymentId;
    req.body.status = 'succeeded';
    req.body.createdAt = createdAt;

    res.status(201).json(response);
    return;
  }

  next();
};
