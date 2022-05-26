import { Task } from 'types'

export const handleTask = (task: Task, protocol: any, onComplete: () => void) => {
  const instruction = task.task["instruction"]

  if (instruction === "add_bundles") {
    protocol?.add_pre_key_bundles().then(() => onComplete())

  } else {
    console.log("Received unexpected task: ", task.task)
  }
}

