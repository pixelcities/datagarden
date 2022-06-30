import { Task, ExecutionError } from 'types'

export const handleTask = (task: Task, protocol: any) => {
  return new Promise<any[]>((resolve, reject) => {
    const instruction = task.task["instruction"]

    if (instruction === "add_bundles") {
      protocol?.add_pre_key_bundles().then(() => resolve([]))

    } else {
      reject(ExecutionError.Failure)
    }
  })
}

