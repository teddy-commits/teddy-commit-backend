const verifyAdmin = (req, res, next) => {
  const token = req.headers['admin-token'];
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Admin token required' 
    });
  }
  
  if (token !== adminToken) {
    return res.status(403).json({ 
      error: 'Invalid admin token' 
    });
  }
  
  next();
};

module.exports = { verifyAdmin };