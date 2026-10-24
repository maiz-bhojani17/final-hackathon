const aiService = require('../services/aiService');

class AiController {
  async chat(req, res, next) {
    try {
      const { message, history } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Message is required' });
      }

      const result = await aiService.chat({
        message,
        history: history || [],
        user: req.user
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async summarize(req, res, next) {
    try {
      const { kpis } = req.body;
      if (!kpis) {
        return res.status(400).json({ message: 'KPI data is required for summarization' });
      }

      const summary = await aiService.summarizeDashboard(kpis);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }

  async smartLeave(req, res, next) {
    try {
      const { sentence } = req.body;
      if (!sentence || !sentence.trim()) {
        return res.status(400).json({ message: 'Sentence is required' });
      }

      const parsed = await aiService.parseSmartLeave(sentence);
      res.json(parsed);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AiController();
