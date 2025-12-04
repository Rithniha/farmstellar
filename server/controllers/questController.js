const Quest = require('../models/Quest');
const User = require('../models/User');

exports.getQuests = async (req, res) => {
  try {
    const quests = await Quest.find({ active: true });
    res.status(200).json(quests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getQuestById = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);
    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }
    res.status(200).json(quest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateQuestProgress = async (req, res) => {
  try {
    const { stageIndex, status } = req.body;
    const user = await User.findById(req.user.userId);

    const questProgress = user.questsProgress.find(p => p.questId.toString() === req.params.id);

    if (questProgress) {
      questProgress.stageIndex = stageIndex;
      questProgress.status = status;
    } else {
      user.questsProgress.push({ questId: req.params.id, stageIndex, status });
    }

    await user.save();
    res.status(200).json(user.questsProgress);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
