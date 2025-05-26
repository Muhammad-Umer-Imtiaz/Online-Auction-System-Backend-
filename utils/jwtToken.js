export const generateToken = (user,message,statusCode,res)=>{
    const token = user.generateJsonWebToken();
    res.status(statusCode).cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "development" ? false : true,
    }).json({
        success: true,
        message,
        token,
        user
    })
}