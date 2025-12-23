// Custom logging middleware for json-server
// Makes request logging very visible for demo purposes
module.exports = (req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.url}`);

  // Log response when it finishes
  res.on('finish', () => {
    const statusEmoji = res.statusCode < 400 ? '✅' : '❌';
    console.log(`${statusEmoji} [${timestamp}] ${req.method} ${req.url} → ${res.statusCode}`);
  });

  next();
};
