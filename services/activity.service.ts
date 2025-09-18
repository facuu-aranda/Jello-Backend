import Activity, { IActivity } from '../models/Activity.model';

type ActivityLogOptions = {
    type: IActivity['type'];
    user: string;
    project: string;
    task?: string;
    meta?: object;
    text: string;
}

export const createActivityLog = async (options: ActivityLogOptions) => {
    try {
        const activity = new Activity({
            type: options.type,
            user: options.user,
            project: options.project,
            task: options.task,
            meta: options.meta,
            text: options.text
        });
        await activity.save();
    } catch (error) {
        // En un proyecto de producción, aquí podrías registrar el error
        // sin detener la ejecución principal.
        console.error("Failed to create activity log:", error);
    }
};