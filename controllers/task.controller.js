const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const Activity = require('../models/Activity.model');

exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params; // Obtenemos el ID del proyecto de la URL
    const { title, description } = req.body;
    const userId = req.user.id;

    // Verificación: ¿El usuario es miembro del proyecto?
    const project = await Project.findById(projectId);
    if (!project || !project.members.includes(userId)) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    const newTask = new Task({
      title,
      description,
      project: projectId,
      assignee: null, // Por ahora la creamos sin asignar
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

exports.getTasksForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { status, assignee, priority, search } = req.query; 

    const project = await Project.findById(projectId);
    if (!project || !project.members.includes(userId)) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    let filter = { project: projectId };
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('labels', 'name color');
      
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = req.user;
    const updateData = req.body;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    const project = task.project;

    if (!project.members.includes(user.id)) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    if (updateData.estimatedTime) {
      if (user.role === 'worker' && !project.allowWorkerEstimation) {
        return res.status(403).json({ message: 'No tienes permiso para estimar tareas en este proyecto.' });
      }
    }

    if (updateData.assignee && !task.assignee) {
      updateData.assignmentDate = new Date();
    }

    if (updateData.status === 'Hecho' && task.status !== 'Hecho') {
      updateData.completionDate = new Date();
    }
    else if (updateData.status !== 'Hecho' && task.status === 'Hecho') {
      updateData.completionDate = null;
    }

    const userFullName = req.user.name;
    if (updateData.status && updateData.status !== task.status) {
      const newActivity = new Activity({
        text: `${userFullName} movió la tarea de "${task.status}" a "${updateData.status}".`,
        user: req.user.id,
        task: taskId
      });
      await newActivity.save();
    }
    if (updateData.assignee && updateData.assignee.toString() !== task.assignee?.toString()) {
      const newActivity = new Activity({
        text: `${userFullName} asignó la tarea.`,
        user: req.user.id,
        task: taskId
      });
      await newActivity.save();
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    // Verificación: Misma comprobación de seguridad
    if (!task.project.members.includes(userId)) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    await Task.findByIdAndDelete(taskId);
    res.json({ message: 'Tarea eliminada con éxito.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

exports.addSubtask = async (req, res) => {
    const { taskId } = req.params;
    const { text } = req.body;
    const task = await Task.findById(taskId);
    task.subtasks.push({ text, isCompleted: false });
    await task.save();
    res.status(201).json(task.subtasks);
};

exports.updateSubtask = async (req, res) => {
    const { taskId, subtaskId } = req.params;
    const { text, isCompleted } = req.body;
    const task = await Task.findById(taskId);
    const subtask = task.subtasks.id(subtaskId);
    if (text) subtask.text = text;
    if (isCompleted !== undefined) subtask.isCompleted = isCompleted;
    await task.save();
    res.json(subtask);
};

exports.deleteSubtask = async (req, res) => {
    const { taskId, subtaskId } = req.params;
    const task = await Task.findById(taskId);
    task.subtasks.id(subtaskId).remove();
    await task.save();
    res.json({ message: 'Sub-tarea eliminada.' });
};