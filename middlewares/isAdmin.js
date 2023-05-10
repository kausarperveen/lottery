
const isAdmin = (req, res, next) => {
  console.log('User:', req.user); // Check if the user object is correct
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    console.log('Unauthorized: Only admin can access this route');
    res.status(401).json({ message: 'Unauthorized' });
  }
};
module.exports={isAdmin}