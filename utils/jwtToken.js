export const generateToken = (user, statusCode, res, message) => {
  const token = user.generateJsonWebToken();
res
  .status(statusCode)
  .cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })
  .json({
    success: true,
    message,
    token,
    user,
  });
}
