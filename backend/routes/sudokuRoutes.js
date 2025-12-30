const express = require("express");
const router = express.Router();
const { generateSudoku } = require("../services/sudokuGenerator");

// GET /api/sudoku/generate
router.get("/generate", (req, res) => {
  try {
    const { puzzle, solution } = generateSudoku();
    // Send both. In single player, it's okay to send solution to frontend 
    // so we can validate instantly without a server call.
    res.json({ puzzle, solution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;