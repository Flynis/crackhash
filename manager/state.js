export default class State {
    _id = 0;
    progress = 0;
    completed = false;

    constructor(req, taskCount, total) {
        this.total = total;
        this.req = req;
        this.pending = new Set();
        this.inProgressTasks = new Set();
        for (let  i = 0; i < taskCount; i++) {
            this.pending.add(i);
            this.inProgressTasks.add(i);
        } 
    }

    confirm(task) {
        this.pending.delete(task);
    }

    complete(task, count) {
        this.progress += count;
        this.inProgressTasks.delete(task);
        if (this.progress == this.total) {
            this.completed = true;
        }
    }

    static copy(state) {
        const s = new State(state.req, 0, state.total);
        s.progress = state.progress;
        s.completed = state.completed;
        for (let i = 0; i < state.pending.length; i += 1) {
            s.pending.add(i);
        }
        for (let i = 0; i < state.inProgressTasks.length; i += 1) {
            s.inProgressTasks.add(i);
        }
        return s;
    }

};

export function freeState() {
    const state = new State("", 0, 0);
    state.completed = true;
    return state;
}
