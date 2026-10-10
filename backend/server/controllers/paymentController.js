// Payment Controller for Smart BUP Cafeteria Management System (SBCMS)
// Provides simulated sandbox integration for bKash, Nagad, and Cash at counter (FR-06).

export function initiatePayment(req, res) {
  const { method, amount, orderId, mobileNumber } = req.body;

  if (!["bkash", "nagad", "cash"].includes(method)) {
    return res.status(400).json({ message: "Unsupported payment method." });
  }

  if (method === "cash") {
    return res.json({
      status: "SUCCESS",
      paymentMethod: "cash",
      message: "Order will be confirmed with Cash on Pickup. Pay at the express counter.",
      transactionId: null,
    });
  }

  // Sandbox simulation token
  const paymentId = `PAY-${method.toUpperCase()}-${Date.now()}`;
  return res.json({
    status: "INITIATED",
    paymentId,
    method,
    amount,
    mobileNumber: mobileNumber || "017XXXXXXXX",
    gatewaySandbox: true,
    message: `Ready for ${method.toUpperCase()} sandbox verification.`,
  });
}

export function confirmPayment(req, res) {
  const { method, mobileNumber, otp, pin, amount } = req.body;

  if (method === "cash") {
    return res.json({
      status: "SUCCESS",
      method: "cash",
      transactionId: null,
      message: "Cash payment confirmed at pickup counter.",
    });
  }

  if (!mobileNumber || mobileNumber.length < 11) {
    return res.status(400).json({ message: "Please provide a valid 11-digit mobile number." });
  }

  if (!pin || pin.length < 4) {
    return res.status(400).json({ message: "Please provide your security PIN." });
  }

  // Generate verified transaction ID
  const prefix = method === "bkash" ? "TRX-BK" : "TRX-NG";
  const transactionId = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

  return res.json({
    status: "SUCCESS",
    method,
    transactionId,
    amount,
    paidAt: new Date().toISOString(),
    message: `${method.toUpperCase()} Payment of ৳${amount} completed successfully!`,
  });
}
