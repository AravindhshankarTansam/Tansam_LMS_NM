export const verifyNMToken = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized NM request" });
  }

  const token = auth.split(" ")[1];

  if (token !== process.env.NM_SHARED_TOKEN) {
    return res.status(403).json({ message: "Invalid NM token" });
  }

  next();
};
