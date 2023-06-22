import { Task, ExecutionError } from 'types'

export const handleTask = (task: Task, protocol: any) => {
  return new Promise<{actions: any[], metadata: {[key: string]: any}, completed_fragments?: string[]}>((resolve, reject) => {
    const instruction = task.task["instruction"]

    if (instruction === "add_bundles") {
      protocol?.add_pre_key_bundles().then(() => resolve({actions: [], metadata: {}}))

    } else {
      reject(ExecutionError.Failure)
    }
  })
}

