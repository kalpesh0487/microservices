const Search = require("../models/Search");
const logger = require("../utils/logger");

// TODO: implement caching here also
// catch-: everytime we have to invaidate a cache also in search
const searchPostController = async (req, res) => {
  logger.info("Search endpoint hit");
  try {
    const { query } = req.query;
    console.log("queryqueryquery", query);
    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    res.json(results);
  } catch (error) {
    logger.error("Error while searching post", error);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

module.exports = { searchPostController };
