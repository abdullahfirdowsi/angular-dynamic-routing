const express = require('express');
const path = require('path');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 3000;

// Compress all responses
app.use(compression());

// Basic security headers
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Serve static files from the dist/browser directory
app.use(express.static(path.join(__dirname, 'dist/dynamic-routing/browser')));

// Set cache headers for static assets
app.use((req, res, next) => {
  // Don't cache index.html
  if (req.url === '/index.html' || req.url === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    // Cache static assets for 1 day
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
});

// All other routes should redirect to the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/dynamic-routing/browser/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Something went wrong on the server');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Serving from: ${path.join(__dirname, 'dist/dynamic-routing/browser')}`);
});
