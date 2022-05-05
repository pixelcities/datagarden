import { Task } from 'types'

export const handleTask = (task: Task, keyStore: any, arrow: any, dataFusion: any, onComplete: () => void) => {
  console.log("Received a transformer task: ", task.task)
}

