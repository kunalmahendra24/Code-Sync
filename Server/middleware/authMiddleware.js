const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
};

const auth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).send({ error: "No Authorization provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id).select(
      "-password -updatedAt -__v"
    );
    if (!user) {
      return res.status(401).send({ error: "Not Authorized" });
    }

    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: e.message });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select(
      "-password -updatedAt -__v"
    );

    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid tokens for optional auth.
  }

  next();
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
