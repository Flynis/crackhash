export default class TaskProgress {

    constructor(array) {
        this.dataview = new DataView(array);
    }

    set current(value) {
        this.dataview.setInt32(0, value);
    }

    get current() {
        return this.dataview.getInt32(0);
    }
    
}

export const TaskProgressSize = Int32Array.BYTES_PER_ELEMENT;