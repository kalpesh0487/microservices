const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const generateTokens = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validateRegisteration, validateLogin } = require("../utils/validation");

// user regi
const registerUser = async (req, res) => {
  logger.info("Registeration endpoint hit");
  try {
    // validate schema
    const { error } = validateRegisteration(req.body);
    if (error) {
      logger.warn("Validation error, ", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password, username } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists, ", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    user = new User({ username, email, password });
    await user.save();
    logger.warn("User saved successfully", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occured, ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// user login
const loginUser = async (req, res) => {
  logger.info("Login endpoint hit");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error, ", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("User not exists, ", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: "User not exists",
      });
    }

    // valid password
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      logger.warn("Invalid password, ", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Registration error occured, ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// refresh token
const refreshTokenUser = async (req, res) => {
  logger.info("Refresh token endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");

      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(storedToken.user);

    if (user) {
      logger.warn("User not found");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken: newAccesstoken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    // delete old refresh token

    await RefreshToken.deleteOne({ _id: storedToken._id });

    res.json({
      accessToken: newAccesstoken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    logger.error("Registration error occured, ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// logout
const logoutUser = async (req, res) => {
  logger.info("Refresh token endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    await RefreshToken.deleteOne({ token: refreshToken});

    logger.info('Refresh token deleted for logout');

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    logger.error("Registration error occured, ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

module.exports = { registerUser, loginUser, refreshTokenUser, logoutUser };
