const Comment = require('../models/Comment.model');
const Task = require('../models/Task.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');

exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

    const newComment = new Comment({ content, author: authorId, task: taskId });
    await newComment.save();

    const populatedComment = await newComment.populate('author', 'name email');
    res.status(201).json(populatedComment);

    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      const usernames = mentions.map(m => m.substring(1));
      const mentionedUsers = await User.find({ name: { $in: usernames } });

      for (const user of mentionedUsers) {
        if (user._id.toString() !== author.id) {
          const notification = new Notification({
            user: user._id,
            text: `${author.name} te ha mencionado en un comentario.`,
            link: `/tasks/${taskId}`
          });
          await notification.save();
        }
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};